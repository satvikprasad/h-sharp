// TODO: Don't hardcode length of input buffer.

import * as wasm from "./wasm";

enum WaveformType {
    Raw,
    Frequency,
};

enum InputType {
    Uninitialised = 0,
    SystemAudio,
    Audio,
    MIDI,
};

interface WaveformData {
    ptr: number;

    isSelected: boolean;
};

interface Input {
    name: string;

    sampleRate: number;
    lsb: number;
    lsa: number;

    rawWaveformIndex: number;
    frequencyWaveformIndex: number;

    inputType: InputType;

    /**
     * togglePlayPause, returns true if audio began playing, false if it is paused.
     * @returns boolean 
     */
    togglePlayPause?: () => boolean;
};

interface AudioData {
    readonly rawBufferFidelity: number;

    inputs: Input[];
    waveforms: WaveformData[];

    withSystemAudio: boolean;

    // WebAssembly properties
    memory: WebAssembly.Memory;
    methods: wasm.IAudio;
};

function createInput(
    audioData: AudioData,
    name: string,
    sampleRate: number,
    lsb: number,
    inputType: InputType
): Input {
    let lsa = audioData.methods.computeLogScaleAmplitude(
        audioData.rawBufferFidelity, lsb
    ); 

    const rawWaveformIndex = audioData.waveforms.length;
    const frequencyWaveformIndex = audioData.waveforms.length + 1;

    audioData.waveforms.push({
        ptr: audioData.methods.createWaveform(512, 512),
        isSelected: false
    });

    audioData.waveforms.push({
        ptr: audioData.methods.createWaveform(256, 512),
        isSelected: false
    });

    return { 
        name,
        sampleRate,
        lsb,
        lsa,
        rawWaveformIndex,
        frequencyWaveformIndex,
        inputType
    };
}

function updateInput(audioData: AudioData, input: Input): void {
    // TODO: Do we need a switch here?
    switch (input.inputType) {
        case InputType.SystemAudio:
        case InputType.Audio:
            audioData.methods.updateFrequencyWaveform(
                getWaveformFromInput(audioData, input, WaveformType.Raw)
                .ptr, 
                getWaveformFromInput(audioData, input, WaveformType.Frequency)
                .ptr,
                input.lsa,
                input.lsb
            );

            break;
        case InputType.Uninitialised:
        case InputType.MIDI:
            break;
    }
}

function updateWaveforms(audioData: AudioData): void {
    audioData.waveforms.forEach((w) => {
        audioData.methods.updateWaveform(w.ptr);
    });
}

function destroyWaveforms(audioData: AudioData): void {
    audioData.waveforms.forEach((w) => {
        audioData.methods.destroyWaveform(w.ptr);
    });
}

async function addInput(
    audioData: AudioData,
    name: string,
    inputType: InputType,
    src?: string,
): Promise<Input> {
    let newInput: Input;

    switch (inputType) {
        case InputType.Audio: {
            if (src == undefined) {
                throw Error("addInput: src is required when adding inputType: audio");
            }

            const audioContext = new AudioContext();

            const audioElement= document.createElement("audio");
            audioElement.src = src;

            const audioTrack = audioContext.createMediaElementSource(
                audioElement
            );
            audioTrack.connect(audioContext.destination);
            audioElement.loop = true;
            audioElement.play();

            await audioContext.audioWorklet.addModule(
                "./renderer/worklets/audio-processor.js"
            );
            const processorNode = new AudioWorkletNode(
                audioContext,
                "audio-processor",
            );
            audioTrack.connect(processorNode).connect(audioContext.destination);

            // TODO: Migrate this to createInput
            const rawWaveformIndex = audioData.waveforms.length;
            const frequencyWaveformIndex = audioData.waveforms.length + 1;

            audioData.waveforms.push({
                ptr: audioData.methods.createWaveform(512, 512),
                isSelected: false,
            });

            audioData.waveforms.push({
                ptr: audioData.methods.createWaveform(256, 512),
                isSelected: false,
            });

            newInput = {
                name,
                sampleRate: audioContext.sampleRate,

                lsb: 0.019,
                lsa: audioData.methods.computeLogScaleAmplitude(512, 0.019),

                rawWaveformIndex, 
                frequencyWaveformIndex,

                inputType: InputType.Audio,
                togglePlayPause: () => {
                    if (audioElement.paused) {
                        audioElement.play();
                        return true;
                    } 

                    audioElement.pause();
                    return false;
                },
            };

            processorNode.port.onmessage = (e) => {
                const buffer = e.data as Float32Array;

                const bufPtr = audioData.methods
                    .getWaveformBuffer(
                        getWaveformFromInput(audioData, newInput, WaveformType.Raw).ptr
                    );

                const memView = wasm.float32MemoryView(audioData.memory, bufPtr, 512);
                memView.set(buffer);
            };

        } break;

        default:
            throw Error(`addInput: InputType ${inputType.toString()} not implemented yet`); 
    }
    audioData.inputs.push(newInput);
    return newInput;
}

function create(
    wasmData: wasm.WASMData,
    withSystemAudio: boolean
): AudioData {
    let inputs: Input[] = [];

    let audioData: AudioData = {
        rawBufferFidelity: 512,
        inputs: inputs,
        withSystemAudio: withSystemAudio,
        memory: wasmData.memory,
        methods: wasmData.audio,
        waveforms: [],
    };

    if (withSystemAudio) {
        let systemInput = createInput(
            audioData,
            "System Audio",
            48000,
            0.019,
            InputType.SystemAudio
        );

        audioData.inputs.push(systemInput);
    }

    return audioData;
}

function update(audioData: AudioData): void {
    audioData.inputs.forEach((input) => {
        updateInput(audioData, input);
    });

    updateWaveforms(audioData);
}

function destroy(audioData: AudioData): void {
    destroyWaveforms(audioData);
}

function updateSystemAudioData(
    audioData: AudioData,
    sysAudioBuffer: Float32Array
) {
    if (!audioData.withSystemAudio) {
        throw Error("Tried to update system audio when we have none!");
    }

    let input = audioData.inputs[0];

    if (input.inputType != InputType.SystemAudio) {
        throw Error("First input was not system audio.");
    }

    // TODO: Ensure this is a shallow copy
    getWaveformBufferFromInputIndex(audioData, 0, WaveformType.Raw)
        .set(sysAudioBuffer);
}

function getWaveformFromInput(
    audioData: AudioData,
    input: Input,
    waveformType: WaveformType
) {
    let index =  -1;

    switch (waveformType) {
        case WaveformType.Raw:
            index = input.rawWaveformIndex;
            break;
        case WaveformType.Frequency:
            index = input.frequencyWaveformIndex;
            break;
        default: 
            throw Error("Unhandled waveformType");
    }

    return audioData.waveforms[index];
}

function getWaveformBufferFromInputIndex(
    audioData: AudioData, 
    inputIndex: number,
    waveformType: WaveformType,
): Float32Array {
    let bufPtr = audioData.methods.getWaveformBuffer(
        getWaveformFromInput(
            audioData, 
            audioData.inputs[inputIndex], 
            waveformType).ptr, 
    );

    switch(waveformType) {
        case WaveformType.Raw: {
            // TODO: Don't hardcode, encode length in WaveformData.
            return wasm.float32MemoryView(audioData.memory, bufPtr, 512);
        };

        case WaveformType.Frequency: {
            return wasm.float32MemoryView(audioData.memory, bufPtr, 256);
        };

        default:
            throw Error("Unknown waveform type.");
    };
}

function getMaximumFromInputIndex(
    audioData: AudioData,
    inputIndex: number,
    waveformType: WaveformType
): number {
    const waveformPtr = getWaveformFromInput(audioData, audioData.inputs[inputIndex], 
        waveformType).ptr;

    return audioData.methods.getWaveformMaximum(
        waveformPtr
    );
}

export { 
    type AudioData,
    type Input,

    InputType,
    WaveformType,

    create, 
    update, 
    destroy,
    
    updateSystemAudioData,
    getWaveformBufferFromInputIndex,

    getMaximumFromInputIndex,

    addInput,
};

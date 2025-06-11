// TODO: Don't hardcode length of input buffer.

import * as wasm from "./wasm";

enum InputType {
    Uninitialised = 0,
    SystemAudio,
    Audio,
    MIDI,
};

interface Input {
    name: string;

    sampleRate: number;
    lsb: number;
    lsa: number;

    rawWaveformPtr: number; // Memory stored in WASM.
    frequencyWaveformPtr: number;

    inputType: InputType;
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

    let rawWaveformPtr = audioData.methods
        .createWaveform(512, 512);
    let frequencyWaveformPtr = audioData.methods
        .createWaveform(256, 512);
    
    return { 
        name,
        sampleRate,
        lsb,
        lsa,
        rawWaveformPtr,
        frequencyWaveformPtr,
        inputType
    };
}

function updateInput(audioData: AudioData, input: Input): void {
    // TODO: Do we need a switch here?
    switch (input.inputType) {
        case InputType.SystemAudio:
        case InputType.Audio:
            audioData.methods.updateFrequencyWaveform(
                input.rawWaveformPtr, 
                input.frequencyWaveformPtr,
                input.lsa,
                input.lsb
            );

            audioData.methods.updateWaveform(input.rawWaveformPtr);
            audioData.methods.updateWaveform(input.frequencyWaveformPtr);
            break;
        case InputType.Uninitialised:
        case InputType.MIDI:
            break;
    }
}

function destroyInput(audioData: AudioData, input: Input): void {
    audioData.methods.destroyWaveform(input.rawWaveformPtr);
    audioData.methods.destroyWaveform(input.frequencyWaveformPtr);
}

interface AudioData {
    readonly rawBufferFidelity: number;

    inputs: Array<Input>;

    withSystemAudio: boolean;

    // WebAssembly properties
    memory: WebAssembly.Memory;
    methods: wasm.IAudio;
};

interface HTMLMediaElementWithCaptureStream extends HTMLMediaElement{
  captureStream(): MediaStream;
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

            audioElement.play();

            await audioContext.audioWorklet.addModule(
                "./renderer/worklets/audio-processor.js"
            );
            const processorNode = new AudioWorkletNode(
                audioContext,
                "audio-processor",
            );
            audioTrack.connect(processorNode).connect(audioContext.destination);

            const sampleRate = audioContext.sampleRate;

            const lsb = 0.019;
            const lsa = audioData.methods.computeLogScaleAmplitude(512, 0.019);

            newInput = {
                name,
                sampleRate,

                lsb,
                lsa,

                rawWaveformPtr: audioData.methods.createWaveform(512, 512),
                frequencyWaveformPtr: audioData.methods.createWaveform(256, 512),

                inputType: InputType.Audio,
            };

            processorNode.port.onmessage = (e) => {
                const buffer = e.data as Float32Array;

                const bufPtr = audioData.methods
                    .getWaveformBuffer(newInput.rawWaveformPtr);

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
    let inputs: Array<Input> = new Array<Input>();

    let audioData: AudioData = {
        rawBufferFidelity: 512,
        inputs: inputs,
        withSystemAudio: withSystemAudio,
        memory: wasmData.memory,
        methods: wasmData.audio,
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
}

function destroy(audioData: AudioData): void {
    audioData.inputs.forEach((input) => {
        destroyInput(audioData, input);
    });
}

function updateSystemAudioData(
    audioData: AudioData,
    sysAudioBuffer: Float32Array
) {
    if (!audioData.withSystemAudio) {
        throw Error("Tried to update system audio when we have none!");
    }

    let input = audioData.inputs[0];
    let bufPtr = audioData.methods.getWaveformBuffer(
        input.rawWaveformPtr
    );

    let mem = wasm.float32MemoryView(audioData.memory, bufPtr, 512);
    mem.set(sysAudioBuffer);
}

enum WaveformType {
    Raw,
    Frequency,
};

function getWaveformBufferFromInputIndex(
    audioData: AudioData, 
    inputIndex: number,
    waveformType: WaveformType,
): Float32Array {
    switch(waveformType) {
        case WaveformType.Raw: {
            let bufPtr = audioData.methods.getWaveformBuffer(
                audioData.inputs[inputIndex].rawWaveformPtr, 
            );

            return wasm.float32MemoryView(audioData.memory, bufPtr, 512);
        };

        case WaveformType.Frequency: {
            let bufPtr = audioData.methods.getWaveformBuffer(
                audioData.inputs[inputIndex].frequencyWaveformPtr, 
            );

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
    let waveformPtr = -1;
        
    switch (waveformType) {
        case WaveformType.Raw: {
            waveformPtr = audioData.inputs[inputIndex].rawWaveformPtr;
        } break;

        case WaveformType.Frequency: {
            waveformPtr = audioData.inputs[inputIndex].frequencyWaveformPtr;
        } break;

        default:
            throw Error("Unknown waveform type.");
    }

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

import * as wasm from "./wasm";
import workletUrl from './worklets/audio-processor?worker&url';

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
    length: number;

    inputIndex: number;
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
    audioElement?: HTMLAudioElement;
    isPlaying?: boolean;
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

function pushNewInput(
    audioData: AudioData,
    name: string,
    sampleRate: number,
    lsb: number,
    inputType: InputType,
    audioElement?: HTMLAudioElement,
    isPlaying?: boolean,
): Input {
    if (inputType == InputType.Audio && (!audioElement || !isPlaying)) {
        throw Error("togglePlayPause is required for inputType = InputType.Audio");
    }

    let lsa = audioData.methods.computeLogScaleAmplitude(
        audioData.rawBufferFidelity, lsb
    ); 

    const rawWaveformIndex = audioData.waveforms.length;
    const frequencyWaveformIndex = audioData.waveforms.length + 1;

    audioData.waveforms.push({
        ptr: audioData.methods.createWaveform(512, 512),
        length: 512,
        inputIndex: audioData.inputs.length
    });

    audioData.waveforms.push({
        ptr: audioData.methods.createWaveform(256, 512),
        length: 256,
        inputIndex: audioData.inputs.length
    });

    let newInput: Input = { 
        name,
        sampleRate,
        lsb,
        lsa,
        rawWaveformIndex,
        frequencyWaveformIndex,
        inputType,
        audioElement,
        isPlaying,
    }

    audioData.inputs.push(newInput);

    return newInput;
}

function updateInput(audioData: AudioData, input: Input): void {
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
            const audioElement = document.createElement("audio");
            audioElement.src = src;
            const audioTrack = audioContext.createMediaElementSource(
                audioElement
            );

            audioTrack.connect(audioContext.destination);

            audioElement.loop = true;
            audioElement.play();

            await audioContext.audioWorklet.addModule(
                workletUrl
            );

            const processorNode = new AudioWorkletNode(
                audioContext,
                "audio-processor",
            );

            audioTrack.connect(processorNode).connect(audioContext.destination);

            newInput = pushNewInput(
                audioData, 
                name,
                audioContext.sampleRate,
                0.019,
                InputType.Audio,
                audioElement,
                true
            );

            processorNode.port.onmessage = (e) => {
                const bufPtr = audioData.methods
                    .getWaveformBuffer(
                        getWaveformFromInput(audioData, newInput, WaveformType.Raw).ptr
                    );

                wasm.float32MemoryView(audioData.memory, bufPtr, 512)
                    .set(e.data as Float32Array);
            };
        } break;

        default:
            throw Error(
                `addInput: InputType ${inputType.toString()} not implemented yet`
            ); 
    }

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
        pushNewInput(
            audioData,
            "System Audio",
            48000,
            0.019,
            InputType.SystemAudio
        );
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

    getWaveformBufferFromInputIndex(audioData, 0, WaveformType.Raw)
        .set(sysAudioBuffer);
}

function inputTogglePlaying(input: Input) {
    if (input.inputType != InputType.Audio) {
        throw Error("Tried to toggle play/pause on non-Audio input.")
    }

    if (input.isPlaying!) {
        input.audioElement!.pause();
    } else {
        input.audioElement!.play();
    }

    input.isPlaying! = !input.isPlaying!;
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
    const waveform = getWaveformFromInput(
        audioData,
        audioData.inputs[inputIndex],
        waveformType
    );

    let bufPtr = audioData.methods.getWaveformBuffer(waveform.ptr);
    return wasm.float32MemoryView(audioData.memory, bufPtr, waveform.length);
}

function getWaveformBuffer(
    audioData: AudioData,
    waveform: WaveformData
): Float32Array {
    const bufPtr = audioData.methods.getWaveformBuffer(waveform.ptr);

    return wasm.float32MemoryView(
        audioData.memory,
        bufPtr,
        waveform.length
    );
}

function getWaveformMaximum(
    audioData: AudioData,
    waveform: WaveformData
): number {
    return audioData.methods.getWaveformMaximum(waveform.ptr);
}

export { 
    type AudioData,
    type Input,
    type WaveformData,

    InputType,
    WaveformType,

    create, 
    update, 
    destroy,
    
    updateSystemAudioData,

    addInput,
 
    getWaveformBuffer,
    getWaveformMaximum,

    inputTogglePlaying,
};

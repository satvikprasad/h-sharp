// TODO: Don't hardcode length of input buffer.

import * as wasm from "./wasm";

interface AData {
    ptr: number;

    methods: wasm.IAudio;
    memory: WebAssembly.Memory;
};

const initialiseAudioData = (
    wasmData: wasm.WASMData 
): AData => {
    return {
        ptr: wasmData.audio.initialise(10),

        methods: wasmData.audio,
        memory: wasmData.memory,
    }
}

const updateAudioData = (
    audioData: AData
) => {
    audioData.methods.update(audioData.ptr);
}

const updateSystemAudioData = (
    audioData: AData,
    sysAudioBuffer: Float32Array
) => {
    let bufPtr = audioData.methods.getSystemBuffer(audioData.ptr);

    let mem = wasm.float32MemoryView(audioData.memory, bufPtr, 512);
    mem.set(sysAudioBuffer);
}

const getBufferFromInput = (
    audioData: AData, 
    inputIndex: number,
    waveformIndex: number,
): Float32Array => {
    let bufPtr = audioData.methods.getBufferFromInput(
        audioData.ptr, 
        inputIndex,
        waveformIndex
    );

    return wasm.float32MemoryView(audioData.memory, bufPtr, 512)
        .slice(0, audioData.methods.getBufferLengthFromInput(
            audioData.ptr, inputIndex, waveformIndex
        ));
}

const getMaximumFromInput = (
    audioData: AData,
    inputIndex: number,
    waveformIndex: number
): number => {
    return audioData.methods.getMaximumFromInput(
        audioData.ptr, inputIndex, waveformIndex
    );
}

export { 
    type AData,

    initialiseAudioData, 

    updateAudioData, 
    updateSystemAudioData,

    getBufferFromInput,
    getMaximumFromInput
};

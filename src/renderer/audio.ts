// TODO: Don't hardcode length of input buffer.

import * as wasm from "./wasm";

interface AData {
    dataPtr: number;

    audio: wasm.IAudio;
    memory: WebAssembly.Memory;
};

const initialiseAudioData = (
    wasmData: wasm.WASMData 
): AData => {
    return {
        dataPtr: wasmData.audio.initialise(10),

        audio: wasmData.audio,
        memory: wasmData.memory,
    }
}

const updateAudioData = (
    audioData: AData
) => {
    audioData.audio.update(audioData.dataPtr);
}

const updateSystemAudioData = (
    audioData: AData,
    sysAudioBuffer: Float32Array
) => {
    let bufPtr = audioData.audio.getSystemBuffer(audioData.dataPtr);

    let mem = wasm.float32MemoryView(audioData.memory, bufPtr, 512);
    mem.set(sysAudioBuffer);
}

const getRawBuffer = (
    audioData: AData, inputIndex: number
): Float32Array => {
    let bufPtr = audioData.audio.getRawBufferFromInput(audioData.dataPtr, inputIndex);

    return wasm.float32MemoryView(audioData.memory, bufPtr, 512);
}

export { 
    type AData,

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData,
    getRawBuffer,
};

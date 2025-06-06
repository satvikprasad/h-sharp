// TODO: Don't hardcode length of input buffer.

import * as wasm from "./wasm";

interface AData {
    ptr: number;

    methods: wasm.IAudio;
    memory: WebAssembly.Memory;

    hasSystemAudio: boolean;

    inputStringsPtr: number;
};

function getInputStrings(
    audioData: AData,
): string[] {
    const wasmMemory = audioData.memory;
    const outSize = audioData.methods.getInputStringsAlignSize(
        audioData.ptr
    );

    let retPtr = audioData.methods.getInputStrings(
        audioData.ptr,
        audioData.inputStringsPtr, // Destination for input strings bufffer
    );
    audioData.inputStringsPtr = retPtr;

    const buf = wasm.u32MemoryView(
        wasmMemory, retPtr, 2*outSize
    ); // [(ptr, len), ...]

    const decoder = new TextDecoder();

    let strings: string[] = [];
    for (let i = 0; i < outSize; ++i) { 
        const strPtr = buf[2*i];
        const strLen = buf[2*i + 1];

        const strBuf = wasm.u8MemoryView(
            wasmMemory,
            strPtr,
            strLen
        );

        strings.push(decoder.decode(strBuf));
    }

    return strings;
}

const initialiseAudioData = (
    wasmData: wasm.WASMData,
    hasSystemAudio: boolean,
): AData => {
    let ptr = wasmData.audio.initialise(10, hasSystemAudio);

    let data: AData = {
        // TODO: Don't hardcode capacity.
        ptr,

        methods: wasmData.audio,
        memory: wasmData.memory,

        hasSystemAudio,

        inputStringsPtr: -1,
    }

    console.log(getInputStrings(data));

    return data;
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

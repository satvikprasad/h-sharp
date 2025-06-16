import { IFileSystemAPI } from "../../interface";

import wasmURL from '../../bin/peggiator.wasm?url';

type TAudioComputeLogScaleAmplitude = (
    N: number,
    k: number,
) => number;

type TAudioCreateWaveform = (
    N: number, 
    num_maximums: number
) => number;

type TAudioUpdateFrequencyWaveform = (
    rawWaveformPtr: number,
    frequencyWaveformPtr: number,
    lsa: number,
    lsb: number
) => void;

type TAudioUpdateWaveform = (
    waveformPtr: number
) => void;

type TAudioDestroyWaveform = (
    waveformPtr: number
) => void;

type TAudioGetWaveformBuffer = (
    waveformPtr: number
) => number;

type TAudioGetWaveformMaximum = (
    waveformPtr: number
) => number;

interface IAudio {
    computeLogScaleAmplitude: TAudioComputeLogScaleAmplitude;
    createWaveform: TAudioCreateWaveform;
    updateFrequencyWaveform: TAudioUpdateFrequencyWaveform;
    updateWaveform: TAudioUpdateWaveform;
    destroyWaveform: TAudioDestroyWaveform;
    getWaveformBuffer: TAudioGetWaveformBuffer;
    getWaveformMaximum: TAudioGetWaveformMaximum;
};

interface WASMData {
    memory: WebAssembly.Memory,
    audio: IAudio;
}

const arrayBufferMemoryView = (
    memory: WebAssembly.Memory,
    ptr: number,
    length: number
) => {
    if (!memory.buffer) {
        console.log("Error generating float32MemoryView from WASM: memory has not yet been instantiated.");
    }

    return memory.buffer.slice(ptr, ptr + length);
}

const u32MemoryView = (
    memory: WebAssembly.Memory,
    ptr: number,
    length: number,
) => {
    if (!memory.buffer) {
        console.log("Error generating float32MemoryView from WASM: memory has not yet been instantiated.");
    }

    let view = new Uint32Array(
        memory.buffer,
        ptr,
        length
    );

    return view;
}

const float32MemoryView = (
    memory: WebAssembly.Memory,
    ptr: number,
    length: number,
) => {
    if (!memory.buffer) {
        console.log("Error generating float32MemoryView from WASM: memory has not yet been instantiated.");
    }

    let view = new Float32Array(
        memory.buffer,
        ptr,
        length
    );

    return view;
}

const u8MemoryView = (
    memory: WebAssembly.Memory,
    ptr: number,
    length: number,
) => {
    if (!memory.buffer) {
        console.log("Error generating float32MemoryView from WASM: memory has not yet been instantiated.");
    }

    let view = new Uint8Array(
        memory.buffer,
        ptr,
        length
    );

    return view;
}


const wasmPrint = (
    memory: WebAssembly.Memory, sPtr: number, length: number
) => {
    if (memory.buffer == null) {
        console.log("Error printing from WASM: WASM Memory has not yet been instantiated.");
    }

    const buf = new Uint8Array(
        memory.buffer,
        sPtr,
        length
    );

    let str = new TextDecoder().decode(buf);

    console.log(`From WASM: ${str}`);
}

const initialiseWASM = async (
    fs: IFileSystemAPI
): Promise<WASMData> => {
    let memory: WebAssembly.Memory | null = null;

    const source = await fs.readFileSync(wasmURL);
    
    if (typeof(source) == "string") {
        throw Error(
            "Received string when reading wasm bytecode."
        );
    }

    const result = await WebAssembly.instantiate(source, {
        env: {
            serverPrint: (
                sPtr: number, length: number
            ) => wasmPrint(memory!, sPtr, length),
            serverPrintFloat: (n: number) => console.log(n),
        }
    });

    memory = result.instance.exports.memory as WebAssembly.Memory;

    let audio: IAudio = {
        computeLogScaleAmplitude: result.instance.exports
        .audioComputeLogScaleAmplitude as TAudioComputeLogScaleAmplitude,

        createWaveform: result.instance.exports
        .audioCreateWaveform as TAudioCreateWaveform,

        updateFrequencyWaveform: result.instance.exports
        .audioUpdateFrequencyWaveform as TAudioUpdateFrequencyWaveform,

        updateWaveform: result.instance.exports
        .audioUpdateWaveform as TAudioUpdateWaveform,

        destroyWaveform: result.instance.exports
        .audioDestroyWaveform as TAudioDestroyWaveform,

        getWaveformBuffer: result.instance.exports
        .audioGetWaveformBuffer as TAudioGetWaveformBuffer,

        getWaveformMaximum: result.instance.exports
        .audioGetWaveformMaximum as TAudioGetWaveformMaximum
    };

    return {
        memory: memory!,
        audio
    };
}

export {
    type WASMData,
    type IAudio,

    initialiseWASM,

    float32MemoryView,
    u8MemoryView,
    u32MemoryView,

    arrayBufferMemoryView
};

type TAudioInitialise = (
    inputCapacity: number
) => number;

type TAudioUpdate = (
    dataPtr: number
) => void;

type TAudioGetSystemBuffer = (
    dataPtr: number
) => number;

type TAudioGetMaximumFromInput = (
    dataPtr: number,
    inputIndex: number,
    waveformIndex: number
) => number;

type TAudioGetBufferFromInput = (
    dataPtr: number,
    inputIndex: number,
    waveformIndex: number
) => number;

type TAudioGetBufferLengthFromInput = (
    dataPtr: number,
    inputIndex: number,
    waveformIndex: number
) => number;

interface IAudio {
    initialise: TAudioInitialise;
    update: TAudioUpdate;
    getSystemBuffer: TAudioGetSystemBuffer;

    getMaximumFromInput: TAudioGetMaximumFromInput;
    getBufferFromInput: TAudioGetBufferFromInput;
    getBufferLengthFromInput: TAudioGetBufferLengthFromInput;
};

interface WASMData {
    memory: WebAssembly.Memory,
    audio: IAudio;
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

const initialiseWASM = async (): Promise<WASMData> => {
    let memory: WebAssembly.Memory | null = null;

    const source = await window.electronAPI.fs.readFileSync("dist/bin/h-sharp.wasm") 
    
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
        initialise: result.instance.exports
        .audioInitialise as TAudioInitialise,

        update: result.instance.exports
        .audioUpdate as TAudioUpdate,

        getSystemBuffer: result.instance.exports
        .audioGetSystemBuffer as TAudioGetSystemBuffer,

        getMaximumFromInput: result.instance.exports
        .audioGetMaximumFromInput as TAudioGetMaximumFromInput,

        getBufferFromInput: result.instance.exports
        .audioGetBufferFromInput as TAudioGetBufferFromInput,

        getBufferLengthFromInput: result.instance.exports
        .audioGetBufferLengthFromInput as TAudioGetBufferLengthFromInput,
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
    float32MemoryView
};

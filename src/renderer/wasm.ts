type TAudioRealFFT = (
    inputPtr: number, 
    outputPtr: number, 
    N: number,
    logScaleAmplitude: number,
    logScaleBase: number,
) => void;

type TAudioComputeLogScaleAmplitude = (
    N: number, k: number) => number;

type TAudioInitialiseBuffers = (N: number) => number;

interface WASMData {
    memory: WebAssembly.Memory,
    audio: {
        initialiseBuffers: (N: number) => number;
        realFFT: TAudioRealFFT;
        computeLogScaleAmplitude: TAudioComputeLogScaleAmplitude;
    };
}

const float32MemoryViewFromWASM = (
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

    const buf = new Uint8Array(memory.buffer.slice(sPtr, length));

    console.log([...buf]);
    let str = new TextDecoder().decode(buf);

    console.log(`From WASM: ${str}`);
}

const initialiseWASM = async (): Promise<WASMData> => {
    let memory: WebAssembly.Memory | null = null;

    const source = await window.electronAPI.fs.readFileSync("wasm/zig-out/bin/h-sharp.wasm") 
    
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

    let audio = {
        realFFT: result.instance.exports
            .audioRealFFT as TAudioRealFFT,
        initialiseBuffers: result.instance.exports
            .audioInitialiseBuffers as TAudioInitialiseBuffers,
        computeLogScaleAmplitude: result.instance.exports
            .audioComputeLogScaleAmplitude as TAudioComputeLogScaleAmplitude,
    };

    return {
        memory: memory!,
        audio
    };
}

export {
    type WASMData,
    type TAudioRealFFT,

    initialiseWASM,
    float32MemoryViewFromWASM
};

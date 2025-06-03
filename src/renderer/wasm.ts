type TAudioRealFFT = (
    inputPtr: number, 
    outputPtr: number, 
    N: number
) => void;

interface WASMData {
    memory: WebAssembly.Memory | null,
        audio: {
            initialiseBuffers: (N: number) => number;
            realFFT: TAudioRealFFT;
        } | null;
}

const wasmPrint = (
    memory: WebAssembly.Memory, sPtr: number, length: number
) => {
    if (memory.buffer == null) {
        console.log("Error printing from WASM: WASM Memory has not yet been instantiated.");
    }

    const buf = new Uint8Array(
        memory.buffer!,
        sPtr,
        length
    );

    console.log(`From WASM: ${new TextDecoder().decode(buf)}`);
}

const initialiseWASM = (): WASMData => {
    let data: WASMData = {
        memory: null,
        audio: null,
    };

    window.electronAPI.fs.readFileSync("wasm/zig-out/bin/h-sharp.wasm").then((source) => {
        if (typeof(source) == "string") {
            throw Error(
                "Received string when reading wasm bytecode."
            );
        }

        const memory = new WebAssembly.Memory(
            { initial: 10, maximum: 100 }
        );

        WebAssembly.instantiate(source, {
            env: {
                server_print: (
                    sPtr: number, length: number
                ) => wasmPrint(data.memory!, sPtr, length),
                memory: memory,
            }
        }).then(result => {
            data.memory = result.instance.exports
                .memory as WebAssembly.Memory;

            data.audio = {
                realFFT: result.instance.exports
                .audio_real_fft as TAudioRealFFT,
                initialiseBuffers: result.instance.exports
                .audio_initialise_buffers as (
                    N: number
                ) => number,
            };
        });
    });

    return data;
}

export {
    type WASMData,

    initialiseWASM,
};

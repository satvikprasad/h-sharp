import { type HSData, hsInitialise, hsRender, hsUpdate } from "./h-sharp";

let deltaTime = 0;

const resizeCanvas = async (
    canvas: HTMLCanvasElement
): Promise<void> => {
    let size: [Number, Number] = await window.electronAPI.frame.getSize();

    canvas.setAttribute("width", String(size[0]));
    canvas.setAttribute("height", String(size[1]));
}
type TRealFFTSignature = (
    inputPtr: number, 
    outputPtr: number, 
    N: number
) => void;

interface WASMData {
    memory: WebAssembly.Memory | null,
    audio: {
        realFFT: TRealFFTSignature;
    } | null;
}

const executeWebAssembly = (): WASMData => {
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
                server_print: (sPtr: number, length: number) => { 
                    if (data.memory == null || data.memory.buffer == null) {
                        console.log("Error printing from WASM: WASM Memory has not yet been instantiated.");
                    }

                    let memoryView = new Uint8Array(
                        data.memory?.buffer!
                    );
                
                    const buf = new Uint8Array(
                        data.memory?.buffer!,
                        sPtr,
                        length
                    );

                    console.log(`From WASM: ${new TextDecoder().decode(buf)}`);
                },
                memory: memory,
            }
        }).then(result => {
            data.memory = result.instance.exports
                .memory as WebAssembly.Memory;

            data.audio = {
                realFFT: result.instance.exports
                    .audio_real_fft as TRealFFTSignature,
            };
        });
    });

    return data;
}

const main = (): void => {
    // Get canvas
    const canvas: HTMLCanvasElement | null = document.querySelector("#gl-canvas");
    if (canvas == null) {
        throw Error("Could not find canvas element");
    }
    // Get gl context
    const gl: WebGLRenderingContext | null = canvas.getContext(
        "webgl2", {
            alpha: false,
            antialias: true,
        }
    );

    if (gl == null) {
        throw Error(`Unable to initialise WebGL.\
            Your browser or machine may not support it.`);
    }

    executeWebAssembly();

    window.electronAPI.frame.onResized((dim) => {
        canvas.setAttribute("width", String(dim.width))
        canvas.setAttribute("height", String(dim.height))

        gl.viewport(0, 0, dim.width, dim.height);
    });
    hsInitialise(
        window.electronAPI, 
        gl,
        canvas
    ).then((hsData: HSData) => {
        // Resize canvas to width of view
        resizeCanvas(canvas).then(() => {
            // Resize viewport
            gl.viewport(0, 0, canvas.width, canvas.height);

            let then = 0;

            const tick: FrameRequestCallback = (now: number) => {
                hsUpdate(hsData, deltaTime);

                hsRender(hsData, deltaTime);

                now *= 0.001; // Convert to seconds.
                deltaTime = now - then;
                then = now;

                requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
        });
    });
};

main();

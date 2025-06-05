import { ILocalAPI } from "../../interface";
import { type HSData, hsInitialise, hsRender, hsUpdate } from "./h-sharp";
import { initialiseLocalSystem } from "./local";
import { initialiseWASM } from "./wasm";

let deltaTime = 0;

const resizeCanvas = async (
    local: ILocalAPI,
    canvas: HTMLCanvasElement
): Promise<void> => {
    let size: [Number, Number] = await local.frame.getSize();

    canvas.setAttribute("width", String(size[0]));
    canvas.setAttribute("height", String(size[1]));
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

    let local: ILocalAPI;
    if (window.local) {
        local = window.local;
    } else {
        local = initialiseLocalSystem();
    }

    local.frame.onResized((dim) => {
        canvas.setAttribute("width", String(dim.width))
        canvas.setAttribute("height", String(dim.height))

        gl.viewport(0, 0, dim.width, dim.height);
    });
    
    initialiseWASM(local.fs).then((wasmData) => {
        hsInitialise(
            local, 
            gl,
            canvas,
            wasmData
        ).then((hsData: HSData) => {
            // Resize canvas to width of view
            resizeCanvas(local, canvas).then(() => {
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
    });
};

main();

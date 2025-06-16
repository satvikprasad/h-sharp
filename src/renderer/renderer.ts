import { ILocalAPI } from "../../interface";
import { PgData, pgInitialise, pgRender, pgUpdate } from "./pg";
import { initialiseLocalSystem } from "./local";
import { initialiseWASM } from "./wasm";

const main = (): void => {
    const container: HTMLDivElement | null = document.querySelector(".container");
    if (container == null) {
        throw Error("Could not find main container.");
    }
        
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
        // We are running inside an electron instance
        local = window.local;
    } else {
        // We are running on the client side
        local = initialiseLocalSystem();
    }

    local.frame.onResized((dim) => {
        container.setAttribute("width", String(dim.width))
        container.setAttribute("height", String(dim.height))

        gl.viewport(0, 0, dim.width, dim.height);
    });

    const initialise = async () => {
        // Resize the canvas.
        const canvasSize = await local.frame.getSize();
        container.setAttribute("width", String(canvasSize[0]));
        container.setAttribute("height", String(canvasSize[0]));

        let wasmData = await initialiseWASM(local.fs);

        let pgData = await pgInitialise(
            local, 
            gl,
            canvas,
            wasmData,
            window.local != undefined
        )

        // Resize canvas to width of view
        // Resize viewport
        gl.viewport(0, 0, canvas.width, canvas.height);

        let deltaTime = 0;
        let then = 0;

        const tick: FrameRequestCallback = (now: number) => {
            pgUpdate(pgData, deltaTime);

            pgRender(pgData, deltaTime);

            now *= 0.001; // Convert to seconds.
            deltaTime = now - then;
            then = now;

            requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    };

    initialise().then(() => {});
};

main();

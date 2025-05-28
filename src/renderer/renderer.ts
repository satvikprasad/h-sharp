import { HSData, hsInitialise, hsRender, hsUpdate } from "./h-sharp";

let deltaTime = 0;

const resizeCanvas = async (
    canvas: HTMLCanvasElement
): Promise<void> => {
    let size: [Number, Number] = await window.electronAPI.frame.getSize();

    canvas.setAttribute("width", String(size[0]));
    canvas.setAttribute("height", String(size[1]));
}

const main = (): void => {
    // Get canvas
    const canvas: HTMLCanvasElement = document.querySelector("#gl-canvas");

    // Get gl context
    const gl: WebGLRenderingContext = canvas.getContext("webgl");
    
    if (!gl) {
        alert(`Unable to initialise WebGL.\
            Your browser or machine may not support it.`);
        return;
    }

    window.electronAPI.frame.onResized((dim) => {
        canvas.setAttribute("width", String(dim.width))
        canvas.setAttribute("height", String(dim.height))

        gl.viewport(0, 0, dim.width, dim.height);
    });

    hsInitialise(window.electronAPI, gl).then((hsData: HSData) => {
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

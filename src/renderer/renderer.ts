import { getShaderProgramInfo, initShaderProgram } from "./shader";
import { drawScene } from "./draw-scene";
import { initBuffers } from "./init-buffers";
import { 
    AData, 
    getMagnitudeAtHz, 
    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData
} from "./audio";

let deltaTime = 0;

// Vertex shader program
const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
    }
  `;

const fsSource = `
    varying lowp vec4 vColor;

    void main() {
        gl_FragColor = vColor;
    }
  `;

const resizeCanvas = async (
    canvas: HTMLCanvasElement
): Promise<void> => {
    let size: [Number, Number] = await window.electronAPI.getSize();

    canvas.setAttribute("width", String(size[0]));
    canvas.setAttribute("height", String(size[1]));
}

const main = (): void => {
    // Get canvas
    const canvas: HTMLCanvasElement = document.querySelector("#gl-canvas");

    const audioData: AData = initialiseAudioData();

    window.electronAPI.onSystemAudioUpdate(
        (buffer: Buffer<Uint8Array>) => {
            // Update buffer
            updateSystemAudioData(audioData, buffer);
        });

    let t = 0;

    resizeCanvas(canvas).then(() => {
        // Get gl context
        const gl: WebGLRenderingContext = canvas.getContext("webgl");

        if (!gl) {
            alert(`Unable to initialise WebGL.\
            Your browser or machine may not support it.`);
            return;
        }

        let then = 0;

        const programInfo = getShaderProgramInfo(
            gl, initShaderProgram(gl, vsSource, fsSource)
        );

        const buffers = initBuffers(gl);

        const render: FrameRequestCallback = (now: number) => {
            updateAudioData(audioData);

            now *= 0.001; // Convert to seconds.
            deltaTime = now - then;
            then = now;
            
            t += deltaTime;

            drawScene(gl, programInfo, buffers,t);

            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);
    });
};

main();

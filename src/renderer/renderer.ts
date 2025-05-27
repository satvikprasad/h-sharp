import { getShaderProgramInfo, initShaderProgram } from "./shader";
import { drawScene } from "./draw-scene";
import { initBuffers } from "./init-buffers";

let squareRotation = 0.0;
let deltaTime = 0;

interface AudioData {
    currentChunk: Buffer | null;
}

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
    const audioData: AudioData = {
        currentChunk: null
    };

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
            window.electronAPI.getAudioBuffer().then((buffer: Buffer) => {
                audioData.currentChunk = buffer
            })
           
            if (audioData.currentChunk) {
                console.log([...audioData.currentChunk])
            }

            now *= 0.001; // Convert to seconds.
            deltaTime = now - then;
            then = now;

            squareRotation += deltaTime;
                
            drawScene(gl, programInfo, buffers, squareRotation);

            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);
    });
};

main();

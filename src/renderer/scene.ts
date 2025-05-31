import { mat4 } from "gl-matrix";
import { type HSData } from "./h-sharp";
import { renderWaveform } from "./objects/waveform";

interface SceneData {
    projMat: mat4;
    mvMat: mat4;
};

const initialiseScene = (
    gl: WebGLRenderingContext
): SceneData => {
    const fov = (45 * Math.PI) / 180;
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;

    const projMat = mat4.create();
    mat4.perspective(projMat, fov, aspect, zNear, zFar);

    const mvMat = mat4.create();

    mat4.translate(
        mvMat,
        mvMat,
        [-0.0, 0.0, -6],
    );

    return { projMat, mvMat }
}

const drawScene = (
    hsData: HSData,
) => {
    let gl = hsData.gl;

    // Rotate the scene weirdly
    mat4.rotate(
        hsData.sceneData.mvMat,
        hsData.sceneData.mvMat,
        hsData.deltaTime,
        [0, 1, 0]
    );

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (hsData.audioData.inputs[0].buffer && 0) {
        renderWaveform(
            hsData.sceneData, 
            gl, 
            hsData.waveformShaderData,
            hsData.audioData.inputs[0].buffer
        );
    } else {
        renderWaveform(
            hsData.sceneData,
            gl,
            hsData.waveformShaderData,
            hsData.audioData.inputs[0].frequencyBuffer
        );
    }
};

export { 
    type SceneData, 

    drawScene, 
    initialiseScene 
};

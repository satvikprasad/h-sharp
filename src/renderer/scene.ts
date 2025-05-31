import { mat3, mat4, vec3 } from "gl-matrix";
import { type HSData } from "./h-sharp";
import { renderWaveform } from "./objects/waveform";

interface SceneData {
    projMat: mat4;
    viewMat: mat4;

    viewMatXRot: number;
    viewMatYRot: number;
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

    const viewMat = mat4.create();

    mat4.translate(
        viewMat,
        viewMat,
        [-0.0, 0.0, -10],
    );

    mat4.rotate(
        viewMat,
        viewMat,
        45/180 * Math.PI,
        [1, 0, 0]
    );

    return { 
        projMat, 
        viewMat,

        viewMatXRot: 0,
        viewMatYRot: 0,
    }
}

const drawScene = (
    hsData: HSData,
) => {
    let gl = hsData.gl;
    let sceneData = hsData.sceneData;

    // TODO: Find a better way to do this.
    sceneData.viewMatXRot += hsData.canvasData.mouseWheel.deltaY
        *hsData.deltaTime;

    sceneData.viewMatYRot += -hsData.canvasData.mouseWheel.deltaX * hsData.deltaTime;

    mat4.rotate(
        sceneData.viewMat,
        mat4.fromTranslation(sceneData.viewMat, [0, 0, -6.0]),
        sceneData.viewMatXRot,
        [1, 0, 0]
    );

    mat4.rotate(
        sceneData.viewMat,
        sceneData.viewMat,
        sceneData.viewMatYRot,
        [0, 1, 0]
    );

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renderWaveform(
        gl, 
        hsData.sceneData, 
        hsData.waveformShaderData,
        hsData.audioData.inputs[0].raw,
        [0, 0, 0]
    );

    renderWaveform(
        gl,
        hsData.sceneData,
        hsData.waveformShaderData,
        hsData.audioData.inputs[0].frequencySpectrum,
        [0, 0, 3]
    );
};

export { 
    type SceneData, 

    drawScene, 
    initialiseScene 
};

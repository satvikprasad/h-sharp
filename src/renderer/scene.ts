import { mat4, vec3 } from "gl-matrix";
import { type HSData } from "./h-sharp";
import { renderWaveform } from "./objects/waveform";
import { CameraData } from "./objects/camera";
import { renderGridlines } from "./objects/gridlines";

interface SceneData {
    projMat: mat4;
    viewMat: mat4;

    cameraData: CameraData;
};

const initialiseScene = (
    gl: WebGLRenderingContext
): SceneData => {
    const fov = (45 * Math.PI) / 180;
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;

    return { 
        projMat: mat4.perspective(
            mat4.create(),
            fov,
            aspect,
            zNear,
            zFar
        ), 
        viewMat: mat4.create(),

        cameraData: {
            xRot: 0,
            yRot: 0,

            radius: 6,

            focus: vec3.fromValues(0, 0, 1.5),
        }
    }
}

const drawScene = (
    hsData: HSData,
) => {
    let gl = hsData.gl;
    let sceneData = hsData.sceneData;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renderGridlines(gl, 
        hsData.sceneData, hsData.gridlinesShaderData,
        1000,
    );

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

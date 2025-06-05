import { mat4, vec3 } from "gl-matrix";
import { type HSData } from "./h-sharp";
import { renderWaveform } from "./objects/waveform";
import { CameraData } from "./objects/camera";
import { renderGridlines } from "./objects/gridlines";
import { getBufferFromInput, getMaximumFromInput } from "./audio";

interface SceneData {
    projMat: mat4;
    viewMat: mat4;

    cameraData: CameraData;
};

const initialiseScene = (
    gl: WebGLRenderingContext
): SceneData => {
    const fov = (100 * Math.PI) / 180;
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
            xRot: 15/180 * Math.PI,
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
    gl.enable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.depthMask(false);

    // Render transparent objects intended for the 
    // background
    renderGridlines(gl, 
        sceneData, hsData.gridlinesShaderData,
        [0.5, 0.5, 0.5, 1.0],
        0.01, 
        1.0,
    );

    gl.depthMask(true);

    if (hsData.audioData.hasSystemAudio) {
        renderWaveform(
            gl, 
            sceneData, 
            hsData.waveformShaderData,
            getBufferFromInput(hsData.audioData, 0, 0),
            [0, 0, 0],
            getMaximumFromInput(hsData.audioData, 0, 0),
        );

        renderWaveform(
            gl,
            sceneData,
            hsData.waveformShaderData,
            getBufferFromInput(hsData.audioData, 0, 1),
            [0, 0, 3],
            getMaximumFromInput(hsData.audioData, 0, 1),
        );
    }

    gl.depthMask(false);
    
    // TODO: Render transparent objects intended for the 
    // foreground.
};

export { 
    type SceneData, 

    drawScene, 
    initialiseScene 
};

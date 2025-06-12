import { mat4, vec3 } from "gl-matrix";
import { type HSData } from "./h-sharp";
import { renderWaveform } from "./objects/waveform";
import { CameraData } from "./objects/camera";
import { renderGridlines } from "./objects/gridlines";

import * as audio from "./audio";
import { renderPixel } from "./objects/square";

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

    let canvas: HTMLCanvasElement = document.querySelector("#gl-canvas")!;

    gl.viewport(0, 0, canvas.width, canvas.height);

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

    hsData.audioData.inputs.forEach((_, i) => {
        const rawPos = hsData.positionData.inputs[i].raw;
        const freqPos = hsData.positionData.inputs[i].frequency;

        renderWaveform(
            gl,
            sceneData,
            hsData.waveformShaderData,
            audio.getWaveformBufferFromInputIndex(hsData.audioData,
                i,
                audio.WaveformType.Raw
            ),
            rawPos,
            audio.getMaximumFromInputIndex(hsData.audioData, i, audio.WaveformType.Raw)
        );

        renderWaveform(
            gl,
            sceneData,
            hsData.waveformShaderData,
            audio.getWaveformBufferFromInputIndex(hsData.audioData, i, 1),
            freqPos,
            audio.getMaximumFromInputIndex(hsData.audioData, i, 1),
        );
    });

    gl.depthMask(false);

    renderPixel(
        gl, 
        hsData.squareShaderData, 
        hsData.inputData.normalisedMousePos,
        [
            0.05, 
            0.05*hsData.canvas.getBoundingClientRect().width/hsData.canvas.getBoundingClientRect().height
        ]
    );

    // TODO: Render transparent objects intended for the 
    // foreground.
};

export { 
    type SceneData, 

    drawScene, 
    initialiseScene 
};

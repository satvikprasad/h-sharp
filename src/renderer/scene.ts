import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { type PgData } from "./pg";
import { renderWaveform } from "./objects/waveform";
import { CameraData } from "./objects/camera";
import { renderGridlines } from "./objects/gridlines";

import * as audio from "./audio";
import { renderSquare } from "./objects/square";

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
    pgData: PgData,
) => { const gl = pgData.gl;
    const sceneData = pgData.sceneData;
    const audioData = pgData.audioData;

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
        sceneData, pgData.gridlinesShaderData,
        [0.5, 0.5, 0.5, 1.0],
        0.01, 
        1.0,
    );

    gl.depthMask(true);

    const screenWidthHeightRatio = pgData.canvas.getBoundingClientRect().height / pgData.canvas.getBoundingClientRect().width;

    audioData.waveforms.forEach((waveform, i) => {
        const center: vec3 = pgData.waveformPositions[i];

        renderWaveform(
            gl, 
            sceneData,
            pgData.waveformShaderData,
            audio.getWaveformBuffer(audioData, waveform),
            center,
            audio.getWaveformMaximum(audioData, waveform)
        );

        // Draw selection surface
        const screenSpaceCenter = pgData.waveformPositionsScreenSpace[i];
        const color: vec4 = (pgData.selectedWaveformIndex == i) ? 
            [1.0, 0.0, 0.0, 1.0] : [1.0, 1.0, 1.0, 1.0];

        // Ensure clipped if off screen.
        if (Math.abs(screenSpaceCenter[2]) < 1.0) {
            renderSquare(
                gl, 
                pgData.squareShaderData,
                vec2.fromValues(screenSpaceCenter[0], screenSpaceCenter[1]),
                [0.015*screenWidthHeightRatio, 0.015],
                color
            );
        }
    });

    gl.depthMask(false);
};

export { 
    type SceneData, 

    drawScene, 
    initialiseScene 
};

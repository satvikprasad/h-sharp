import { mat4, vec2, vec3 } from "gl-matrix";
import type { ILocalAPI } from "../../interface";

import * as audio from "./audio";

import { initialiseInputList, InputListData, updateInputListSelectedItem } from "./components/input-list";

import * as pgMath from "./math";

import { createViewMatFromCamera } from "./objects/camera";

import { CameraData } from "./objects/camera";

import { type SceneData, drawScene, initialiseScene } from "./scene";
import * as shader from "./shader";
import { WASMData } from "./wasm";

interface InputData {
    mouseWheel: {
        deltaX: number;
        deltaY: number;
    };

    deltaZoom: number;

    normalisedMousePos: vec2;

    leftMouseDown: boolean;
    rightMouseDown: boolean;

    keyDown: { [key: string]: boolean };
    keyPressed: { [key: string]: boolean };
}

interface PgData {
    audioData: audio.AudioData;
    sceneData: SceneData;
    inputData: InputData;
    wasmData: WASMData;
    inputListData: InputListData;

    gl: WebGLRenderingContext;

    defaultShaderData: shader.DefaultShader.Data;
    waveformShaderData: shader.WaveformShader.Data;
    gridlinesShaderData: shader.GridlinesShader.Data;
    squareShaderData: shader.SquareShader.Data;

    // TODO: Think about moving this to SceneData
    waveformPositions: vec3[];
    waveformPositionsScreenSpace: vec3[];
    selectedWaveformIndex: number;

    // Temporaries
    time: number;
    deltaTime: number;

    canvas: HTMLCanvasElement;
}

const initialiseCanvas = (_canvas: HTMLCanvasElement): InputData => {
    return {
        mouseWheel: {
            deltaX: 0,
            deltaY: 0,
        },

        normalisedMousePos: [0, 0],

        deltaZoom: 0,

        leftMouseDown: false,
        rightMouseDown: false,

        keyDown: {},
        keyPressed: {},
    };
};

const pgInitialise = async (
    local: ILocalAPI,
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
    wasmData: WASMData,
    isNative: boolean
): Promise<PgData> => {
    const audioData = audio.create(wasmData, isNative);
    const sceneData = initialiseScene(gl);
    const inputData = initialiseCanvas(canvas);

    document.onkeydown = function (e) {
        const key = e.key;

        if (!inputData.keyDown[key]) {
            inputData.keyPressed[key] = true;
        }

        inputData.keyDown[key] = true;
    };

    document.onkeyup = function (e) {
        const key = e.key;

        inputData.keyDown[key] = false;
    };

    // Listen to mouse events
    canvas.addEventListener("wheel", (event) => {
        event.preventDefault();

        if (event.ctrlKey) {
            // Zoom event
            inputData.deltaZoom = event.deltaY;
            return;
        }

        inputData.mouseWheel.deltaX = event.deltaX;
        inputData.mouseWheel.deltaY = -event.deltaY;
    });

    canvas.addEventListener("mousemove", (event) => {
        const boundingRect = canvas.getBoundingClientRect();

        inputData.normalisedMousePos[0] =
            (2 * (event.clientX - boundingRect.x)) / boundingRect.width - 1.0;

        inputData.normalisedMousePos[1] =
            1.0 - (2 * (event.clientY - boundingRect.y)) / boundingRect.height;
    });

    canvas.addEventListener("mousedown", (event) => {
        switch (event.button) {
            case 0:
                inputData.leftMouseDown = true;
                break;
        }
    });

    canvas.addEventListener("mouseup", (event) => {
        switch (event.button) {
            case 0:
                inputData.leftMouseDown = false;
                break;
        }
    });

    // Callback from main.ts whenever new
    // system audio is received
    local.audio.onListener((buffer: Float32Array) => {
        if (buffer.length != 512) {
            throw Error("System audio buffer length was not 512.");
        }

        // Update buffer
        audio.updateSystemAudioData(audioData, buffer);
    });

    // Initialise shaders
    const defaultShaderData = await shader.DefaultShader.initialise(
        gl,
        local.fs
    );

    const waveformShaderData = await shader.WaveformShader.initialise(
        gl,
        local.fs,
        100
    );

    const gridlinesShaderData = await shader.GridlinesShader.initialise(
        gl,
        local.fs
    );

    const squareShaderData = await shader.SquareShader.initialise(gl, local.fs);

    const waveformPositions: vec3[] = [];

    if (isNative) {
        // Initialise positions for system audio
        waveformPositions[0] = [0.0, 0.0, 0.0];
        waveformPositions[1] = [0.0, 0.0, 2.0];
    }

    const inputListData = initialiseInputList(audioData, waveformPositions);

    const pgData: PgData = {
        audioData,
        sceneData,
        inputData,
        wasmData,
        inputListData,

        waveformPositions,
        waveformPositionsScreenSpace: [],
        selectedWaveformIndex: -1,

        gl,

        defaultShaderData,
        waveformShaderData,
        gridlinesShaderData,
        squareShaderData,

        time: 0,
        deltaTime: 0,

        canvas,
    };

    return pgData;
};

function updateCameraData(
    cameraData: CameraData,
    inputData: InputData,
    deltaTime: number
): mat4 {
    cameraData.xRot += inputData.mouseWheel.deltaY * deltaTime;

    cameraData.yRot += -inputData.mouseWheel.deltaX * deltaTime;

    cameraData.xRot = pgMath.clamp(
        cameraData.xRot,
        (-1 / 3) * Math.PI,
        (1 / 3) * Math.PI
    );

    let viewMat = createViewMatFromCamera(cameraData);

    cameraData.radius += 5 * inputData.deltaZoom * deltaTime;

    return viewMat;
}

const updateScene = (pgData: PgData) => {
    let sceneData = pgData.sceneData;

    if (pgData.inputData.keyPressed["e"]) {
        // Center the camera.
        sceneData.cameraData.xRot = 0;
        sceneData.cameraData.yRot = 0;
        sceneData.cameraData.radius = 1;

        pgData.inputData.mouseWheel.deltaX = 0;
        pgData.inputData.mouseWheel.deltaY = 0;
    }

    sceneData.viewMat = updateCameraData(
        sceneData.cameraData,
        pgData.inputData,
        pgData.deltaTime
    );

    // Update camera rotation
    // Update position of waveforms.
    pgData.audioData.waveforms.forEach((_, i) => {
        const pos = pgData.waveformPositions[i];

        let screenSpacePos = vec3.create();
        vec3.transformMat4(screenSpacePos, pos, sceneData.viewMat);
        vec3.transformMat4(screenSpacePos, screenSpacePos, sceneData.projMat);

        pgData.waveformPositionsScreenSpace[i] = screenSpacePos;
    });

    const screenWidthHeightRatio =
        pgData.canvas.getBoundingClientRect().height /
        pgData.canvas.getBoundingClientRect().width;

    if (pgData.inputData.leftMouseDown) {
        pgData.audioData.waveforms.forEach((_, i) => {
            const screenSpacePos: vec3 = pgData.waveformPositionsScreenSpace[i];
            const mousePos: vec2 = pgData.inputData.normalisedMousePos;
            const halfDim: vec2 = [0.015 * screenWidthHeightRatio, 0.015];

            let diff: vec2 = vec2.subtract(
                vec2.create(),
                mousePos,
                vec2.fromValues(screenSpacePos[0], screenSpacePos[1])
            );

            if (
                diff[0] < halfDim[0] &&
                diff[0] > -halfDim[0] &&
                diff[1] < halfDim[1] &&
                diff[1] > -halfDim[1]
            ) {
                pgData.selectedWaveformIndex = i;
            }
        });
    } else {
        pgData.selectedWaveformIndex = -1;
    }

    if (pgData.selectedWaveformIndex >= 0) {
        const worldSpaceMousePos = vec3.transformMat4(
            vec3.create(),
            vec3.fromValues(
                pgData.inputData.normalisedMousePos[0],
                pgData.inputData.normalisedMousePos[1],
                pgData.waveformPositionsScreenSpace[
                    pgData.selectedWaveformIndex
                ][2]
            ),
            mat4.invert(mat4.create(), sceneData.projMat)
        );

        vec3.transformMat4(
            worldSpaceMousePos,
            worldSpaceMousePos,
            mat4.invert(mat4.create(), sceneData.viewMat)
        );

        pgData.waveformPositions[pgData.selectedWaveformIndex] =
            worldSpaceMousePos;
    }
};

const updateInputs = (pgData: PgData) => {
    pgData.inputData.mouseWheel.deltaX = pgMath.lerp(
        pgData.inputData.mouseWheel.deltaX,
        0,
        0.05
    );

    pgData.inputData.mouseWheel.deltaY = pgMath.lerp(
        pgData.inputData.mouseWheel.deltaY,
        0,
        0.05
    );

    pgData.inputData.deltaZoom = pgMath.lerp(
        pgData.inputData.deltaZoom,
        0,
        0.05
    );
};

const pgUpdate = (pgData: PgData, deltaTime: number) => {
    pgData.deltaTime = deltaTime;
    pgData.time += pgData.deltaTime;

    audio.update(pgData.audioData);

    updateInputs(pgData);
    updateScene(pgData);

    updateInputListSelectedItem(
        pgData.inputListData,
        pgData.audioData.inputs,
        pgData.audioData.waveforms,
        pgData.selectedWaveformIndex
    );

    // Update keyPressed dictionary
    Object.entries(pgData.inputData.keyPressed).forEach((kv) => {
        if (kv[1] == false) return;

        pgData.inputData.keyPressed[kv[0]] = false;
    });
};

const pgRender = (pgData: PgData, _deltaTime: number) => {
    drawScene(pgData);
};

export { type PgData, pgInitialise, pgUpdate, pgRender };

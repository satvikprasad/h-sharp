import type { ILocalAPI } from "../../interface";

import * as audio from "./audio";

import { initialiseInputList } from "./input-list";

import { CNum } from "./math/number";

import { createViewMatFromCamera } from "./objects/camera";

import { 
    type SceneData,

    drawScene, 
    initialiseScene 
} from "./scene";
import { DefaultShader } from "./shaders/default-shader";
import { GridlinesShader } from "./shaders/gridlines-shader";
import { WaveformShader } from "./shaders/waveform-shader";
import { WASMData } from "./wasm";

interface InputData {
    mouseWheel: {
        deltaX: number;
        deltaY: number;
    };

    deltaZoom: number;
};

interface HSData {
    audioData: audio.AudioData;
    sceneData: SceneData;
    inputData: InputData;
    wasmData: WASMData;

    gl: WebGLRenderingContext;
    
    defaultShaderData: DefaultShader.Data;
    waveformShaderData: WaveformShader.Data;
    gridlinesShaderData: GridlinesShader.Data;

    // Temporaries
    time: number;
    deltaTime: number;
}

const initialiseCanvas = (_canvas: HTMLCanvasElement): InputData => {
    return {
        mouseWheel: {
            deltaX: 0, 
            deltaY: 0
        },

        deltaZoom: 0,
    };
}

const hsInitialise = async (
    local: ILocalAPI,
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
    wasmData: WASMData,
    isNative: boolean,
): Promise<HSData> => {
    const audioData = audio.create(wasmData, isNative);
    const sceneData = initialiseScene(gl);
    const inputData = initialiseCanvas(canvas);

    initialiseInputList(audioData);

    // Listen to mouse events
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();

        if (event.ctrlKey) {
            // Zoom event
            inputData.deltaZoom = event.deltaY;
            return;
        }

        inputData.mouseWheel.deltaX = event.deltaX;
        inputData.mouseWheel.deltaY = -event.deltaY;
    });

    // Callback from main.ts whenever new 
    // system audio is received
    local.audio.onListener(
        (buffer: Float32Array) => {
            if (buffer.length != 512) {
                throw Error("System audio buffer length was not 512.");
            }

            // Update buffer
            audio.updateSystemAudioData(audioData, buffer);
        });

    // Initialise shaders
    const defaultShaderData = await DefaultShader.initialise(
        gl, local.fs
    );

    const waveformShaderData = await WaveformShader.initialise(
        gl, local.fs, 100
    );

    const gridlinesShaderData = await GridlinesShader.initialise(
        gl, local.fs
    );

    return {
        audioData,
        sceneData,
        inputData,
        wasmData,

        gl,

        defaultShaderData,
        waveformShaderData,
        gridlinesShaderData,

        time: 0,
        deltaTime: 0,
    };
}

const updateScene = (hsData: HSData) => {
    let sceneData = hsData.sceneData;

    sceneData.cameraData.xRot += hsData.inputData.mouseWheel.deltaY
        *hsData.deltaTime;

    sceneData.cameraData.yRot += -hsData.inputData.mouseWheel.deltaX * hsData.deltaTime;

    sceneData.cameraData.xRot = CNum.clamp(
        sceneData.cameraData.xRot,
        -1/3 * Math.PI,
        1/3 * Math.PI
    );

    sceneData.viewMat = createViewMatFromCamera(
        sceneData.cameraData
    );

    sceneData.cameraData.radius += 5*hsData.inputData.deltaZoom * hsData.deltaTime;
}

const updateInputs = (hsData: HSData) => {
    hsData.inputData.mouseWheel.deltaX = CNum.lerp(
        hsData.inputData.mouseWheel.deltaX, 0, 0.05
    );

    hsData.inputData.mouseWheel.deltaY = CNum.lerp(
        hsData.inputData.mouseWheel.deltaY, 0, 0.05
    );

    hsData.inputData.deltaZoom = CNum.lerp(
        hsData.inputData.deltaZoom, 0, 0.05
    );
}

const hsUpdate = (hsData: HSData, deltaTime: number) => {
    hsData.deltaTime = deltaTime;
    hsData.time += hsData.deltaTime;

    audio.update(hsData.audioData);

    updateInputs(hsData);
    updateScene(hsData);
}

const hsRender = (hsData: HSData, _deltaTime: number) => {
    drawScene(hsData);
}

export {
    type HSData,

    hsInitialise,
    hsUpdate,
    hsRender,
};

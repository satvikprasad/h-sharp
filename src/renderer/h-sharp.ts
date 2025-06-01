import type { IElectronAPI } from "../../interface";

import { 
    type AData, 

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData 
} from "./audio";

import { CNum } from "./math/number";

import { createViewMatFromCamera } from "./objects/camera";

import { 
    type SceneData,

    drawScene, 
    initialiseScene 
} from "./scene";
import { TestShader } from "./shaders/test-shader";
import { WaveformShader } from "./shaders/waveform-shader";

interface InputData {
    mouseWheel: {
        deltaX: number;
        deltaY: number;
    };

    deltaZoom: number;
};

interface HSData {
    audioData: AData;
    sceneData: SceneData;
    inputData: InputData;

    gl: WebGLRenderingContext;
    
    testShaderData: TestShader.Data;
    waveformShaderData: WaveformShader.Data;

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
    e: IElectronAPI,
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
): Promise<HSData> => {
    const audioData = initialiseAudioData();
    const sceneData = initialiseScene(gl);
    const inputData = initialiseCanvas(canvas);

    // Listen to mouse events
    canvas.addEventListener('wheel', (event) => {
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
    e.audio.onListener(
        (buffer: Float32Array) => {
            // Update buffer
            updateSystemAudioData(audioData, buffer);
        });

    // Initialise shaders
    const testShaderData = await TestShader.initialise(
        gl, e.fs
    );

    const waveformShaderData = await WaveformShader.initialise(
        gl, e.fs, 100
    );

    return {
        audioData,
        sceneData,
        inputData,

        gl,

        testShaderData,
        waveformShaderData,

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

    updateAudioData(hsData.audioData);
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

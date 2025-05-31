import type { IElectronAPI } from "../../interface";

import { 
    type AData, 

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData 
} from "./audio";
import { CNum } from "./math/number";

import { 
    type SceneData,

    drawScene, 
    initialiseScene 
} from "./scene";
import { TestShader } from "./shaders/test-shader";
import { WaveformShader } from "./shaders/waveform-shader";

interface CanvasData {
    mouseWheel: {
        deltaX: number;
        deltaY: number;
    };
};

interface HSData {
    audioData: AData;
    sceneData: SceneData;
    canvasData: CanvasData;

    gl: WebGLRenderingContext;
    
    testShaderData: TestShader.Data;
    waveformShaderData: WaveformShader.Data;

    // Temporaries
    time: number;
    deltaTime: number;
}

const initialiseCanvas = (_canvas: HTMLCanvasElement): CanvasData => {
    return {
        mouseWheel: {
            deltaX: 0, 
            deltaY: 0
        }
    };
}

const hsInitialise = async (
    e: IElectronAPI,
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
): Promise<HSData> => {
    const audioData = initialiseAudioData();
    const sceneData = initialiseScene(gl);
    const canvasData = initialiseCanvas(canvas);

    // Listen to mouse events
    canvas.addEventListener('wheel', (event) => {
        canvasData.mouseWheel.deltaX = event.deltaX;
        canvasData.mouseWheel.deltaY = -event.deltaY;
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
        canvasData,

        gl,

        testShaderData,
        waveformShaderData,

        time: 0,
        deltaTime: 0,
    };
}

const hsUpdate = (hsData: HSData, deltaTime: number) => {
    updateAudioData(hsData.audioData);

    hsData.time += deltaTime;
    hsData.deltaTime = deltaTime;

    hsData.canvasData.mouseWheel.deltaX = CNum.lerp(hsData.canvasData.mouseWheel.deltaX, 0, 0.05);
    hsData.canvasData.mouseWheel.deltaY = CNum.lerp(hsData.canvasData.mouseWheel.deltaY, 0, 0.05);
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

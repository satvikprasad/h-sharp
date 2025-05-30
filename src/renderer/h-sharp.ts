import type { IElectronAPI } from "../../interface";

import { 
    type AData, 

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData 
} from "./audio";

import { 
    type SceneData,

    drawScene, 
    initialiseScene 
} from "./scene";
import { TestShader } from "./shaders/test-shader";
import { WaveformShader } from "./shaders/waveform-shader";

interface HSData {
    audioData: AData;
    sceneData: SceneData;

    gl: WebGLRenderingContext;
    
    testShaderData: TestShader.Data;
    waveformShaderData: WaveformShader.Data;

    // Temporaries
    time: number;
    deltaTime: number;
}

const hsInitialise = async (
    e: IElectronAPI,
    gl: WebGLRenderingContext,
): Promise<HSData> => {
    const audioData = initialiseAudioData();
    const sceneData = initialiseScene(gl);

    // Callback from main.ts whenever new 
    // system audio is received
    e.audio.onListener(
        (buffer: Array<number>) => {
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

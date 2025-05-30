import type { IElectronAPI } from "../../interface";

import { 
    type AData, 

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData 
} from "./audio";

import { drawScene } from "./draw-scene";
import { initShaderProgram } from "./shader";
import { TestShader } from "./shaders/test-shader";
import { WaveformShader } from "./shaders/waveform-shader";

interface HSData {
    audioData: AData;

    gl: WebGLRenderingContext;

    // Test square vertex buffer
    testBuffers: TestShader.VertexBuffer; 

    frequencyWaveformBufferData: {
        vBuffer: WaveformShader.VertexBuffer,
        indexCount: number,
    };
    
    testShaderData: TestShader.Data;
    waveformShaderData: WaveformShader.Data;

    // Temporaries
    t: number;
}

const hsInitialise = async (
    e: IElectronAPI,
    gl: WebGLRenderingContext,
): Promise<HSData> => {
    const audioData = initialiseAudioData();

    // Callback from main.ts whenever new 
    // system audio is received
    e.audio.onListener(
        (buffer: Buffer<Uint8Array>) => {
            // Update buffer
            updateSystemAudioData(audioData, buffer);
        });

    // Initialise shaders
    const testShaderData = await TestShader.initialise(
        gl, e.fs
    );

    const waveformShaderData = await WaveformShader.initialise(
        gl, e.fs
    );

    // Setup position buffers
    const testBuffers = TestShader.initBuffers(gl);
    const frequencyWaveformBufferData = WaveformShader
        .initBuffers(gl, 100);

    return {
        audioData,
        gl,

        testBuffers,
        frequencyWaveformBufferData,

        testShaderData,
        waveformShaderData,

        t: 0,
    };
}

const hsUpdate = (hsData: HSData, deltaTime: number) => {
    updateAudioData(hsData.audioData);

    hsData.t += deltaTime;
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

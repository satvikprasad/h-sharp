import type { IElectronAPI } from "../../interface";

import { 
    type AData, 

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData 
} from "./audio";

import { drawScene } from "./draw-scene";

import { 
    TestBuffer, 
    FrequencyWaveformBuffer, 
} from "./init-buffers";

import { 
    type DefaultProgramInfo,

    getDefaultShaderProgramInfo, 
    getWaveformShaderProgramInfo, 
    initShaderProgram,
    WaveformProgramInfo, 
} from "./shader";

interface HSData {
    audioData: AData;

    gl: WebGLRenderingContext;

    // Test square vertex buffer
    testBuffers: TestBuffer.VertexBuffer; 

    frequencyWaveformBufferData: {
        vBuffer: FrequencyWaveformBuffer.VertexBuffer,
        indexCount: number,
    };
    
    defaultProgramInfo: DefaultProgramInfo;
    waveformProgramInfo: WaveformProgramInfo;

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

    // Get defaultShaderProgramInfo
    const defaultShadProgram = await initShaderProgram(
        gl,
        "vertex-shader.glsl",
        "fragment-shader.glsl",
        e.fs,
    );

    if (defaultShadProgram == null) {
        throw Error(`Exiting as h-sharp was unable to initialise the default shader program.`);
    }

    const defaultProgramInfo = getDefaultShaderProgramInfo(
        gl, defaultShadProgram
    );

    // Get waveformProgramInfo
    const waveformShadProgram = await initShaderProgram(
        gl,
        "waveform-vertex.glsl",
        "waveform-fragment.glsl",
        e.fs
    );

    if (waveformShadProgram == null) {
        throw Error(
            `Exiting. H-Sharp was unable to initialise the waveform shader program.`
        );
    }

    const waveformProgramInfo = getWaveformShaderProgramInfo(
        gl, waveformShadProgram
    );

    // Setup position buffers
    const testBuffers = TestBuffer.initBuffers(gl);
    const frequencyWaveformBufferData = FrequencyWaveformBuffer
        .initBuffers(gl, 100);

    return {
        audioData: audioData,

        gl: gl,

        testBuffers: testBuffers,
        frequencyWaveformBufferData: frequencyWaveformBufferData,

        defaultProgramInfo: defaultProgramInfo,
        waveformProgramInfo: waveformProgramInfo,

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

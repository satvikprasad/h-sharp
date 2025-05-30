import type { IElectronAPI } from "../../interface";

import { 
    type AData, 

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData 
} from "./audio";

import { drawScene } from "./draw-scene";

import { 
    type VertexBuffer,

    TestBuffer, 
    FrequencyWaveformBuffer, 
} from "./init-buffers";

import { 
    type DefaultProgramInfo,

    getDefaultShaderProgramInfo, 
    initShaderProgram, 
} from "./shader";

interface HSData {
    audioData: AData;

    gl: WebGLRenderingContext;

    // Test square vertex buffer
    testBuffers: VertexBuffer; 

    frequencyWaveformBufferData: {
        vBuffer: VertexBuffer,
        indexCount: number,
    };
    
    defaultProgramInfo: DefaultProgramInfo;

    // Temporaries
    t: number;
}

const hsInitialise = async (
    e: IElectronAPI,
    gl: WebGLRenderingContext,
): Promise<HSData> => {
    const audioData: AData = initialiseAudioData();

    // Callback from main.ts whenever new 
    // system audio is received
    e.audio.onListener(
        (buffer: Buffer<Uint8Array>) => {
            // Update buffer
            updateSystemAudioData(audioData, buffer);
        });

    const shadProgram = await initShaderProgram(
        gl,
        "vertex-shader.glsl",
        "fragment-shader.glsl",
        e.fs,
    );

    if (shadProgram == null) {
        throw Error(`Exiting as h-sharp was unable to initialise the default shader program.`);
    }

    const programInfo = getDefaultShaderProgramInfo(gl, shadProgram);

    const testBuffers = TestBuffer.initBuffers(gl);
    const frequencyWaveformBufferData = FrequencyWaveformBuffer
        .initBuffers(gl, 100);

    return {
        audioData: audioData,

        gl: gl,

        testBuffers: testBuffers,
        frequencyWaveformBufferData: frequencyWaveformBufferData,

        defaultProgramInfo: programInfo,

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

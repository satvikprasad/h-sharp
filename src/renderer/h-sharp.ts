import { IElectronAPI } from "../../interface";
import { AData, initialiseAudioData, updateAudioData, updateSystemAudioData } from "./audio";
import { drawScene } from "./draw-scene";
import { initBuffers, VertexBuffer } from "./init-buffers";
import { getShaderProgramInfo, initShaderProgram, ProgramInfo } from "./shader";

interface HSData {
    audioData: AData;

    gl: WebGLRenderingContext;
    buffers: VertexBuffer;
    programInfo: ProgramInfo;

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

    const programInfo = getShaderProgramInfo(gl, shadProgram);

    const buffers = initBuffers(gl);

    return {
        audioData: audioData,

        gl: gl,
        buffers: buffers,
        programInfo: programInfo,

        t: 0,
    };
}

const hsUpdate = (hsData: HSData, deltaTime: number) => {
    updateAudioData(hsData.audioData);

    hsData.t += deltaTime;
}

const hsRender = (hsData: HSData, _deltaTime: number) => {
    drawScene(
        hsData.gl, 
        hsData.programInfo, 
        hsData.buffers, 
        hsData.t
    );
}

export {
    HSData,

    hsInitialise,
    hsUpdate,
    hsRender,
};

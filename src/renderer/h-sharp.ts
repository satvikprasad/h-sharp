import { mat4, vec2, vec3 } from "gl-matrix";
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
import { SquareShader } from "./shaders/square-shader";
import { WaveformShader } from "./shaders/waveform-shader";
import { WASMData } from "./wasm";

interface InputData {
    mouseWheel: {
        deltaX: number;
        deltaY: number;
    };

    deltaZoom: number;

    normalisedMousePos: vec2,
};

interface InputPositionData {
    raw: vec3;
    frequency: vec3;
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
    squareShaderData: SquareShader.Data;

    positionData: {
        inputs: InputPositionData[];
    };

    // Temporaries
    time: number;
    deltaTime: number;

    canvas: HTMLCanvasElement;
}

const initialiseCanvas = (_canvas: HTMLCanvasElement): InputData => {
    return {
        mouseWheel: {
            deltaX: 0, 
            deltaY: 0
        },

        normalisedMousePos: [0, 0],

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

    canvas.addEventListener('mousemove',  (event) => {
        const boundingRect = canvas.getBoundingClientRect();
        inputData.normalisedMousePos[0] = 2*(event.clientX - boundingRect.x)/boundingRect.width - 1.0;
        inputData.normalisedMousePos[1] = 1.0 - 2*(event.clientY - boundingRect.y)/boundingRect.height;
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

    const squareShaderData = await SquareShader.initialise(
        gl, local.fs
    );

    return {
        audioData,
        sceneData,
        inputData,
        wasmData,
        positionData: {
            inputs: [],
        },

        gl,

        defaultShaderData,
        waveformShaderData,
        gridlinesShaderData,
        squareShaderData,

        time: 0,
        deltaTime: 0,

        canvas,
    };
}

function calculateShortestDistanceSquared(pos: vec3, near: vec3, far: vec3): number {
    let diff = vec3.create();
    vec3.subtract(diff, pos, near);

    let line = vec3.create();
    vec3.subtract(line, far, near);

    let scale: number = vec3.dot(diff, line)/vec3.dot(line, line);

    let p = vec3.create();
    vec3.scale(p, line, scale);

    let perp = vec3.create();
    vec3.subtract(perp, diff, p);

    return vec3.squaredLength(perp);
}

function calculateNearFarMouseCoords(sceneData: SceneData, inputData: InputData): {
    near: vec3, far: vec3
} {
    let viewInv: mat4 = mat4.create();
    mat4.invert(viewInv, sceneData.viewMat);

    let projInv: mat4 = mat4.create();
    mat4.invert(projInv, sceneData.projMat);

    let inv = mat4.create();
    mat4.multiply(inv, viewInv, projInv);

    let nearMousePos: vec3 = vec3.fromValues(
        inputData.normalisedMousePos[0], 
        inputData.normalisedMousePos[1], 
        -1.0
    );

    let farMousePos: vec3 = vec3.fromValues(
        inputData.normalisedMousePos[0], 
        inputData.normalisedMousePos[1], 
        1.0
    );

    let near: vec3 = vec3.create();
    vec3.transformMat4(near, nearMousePos, inv);

    let far: vec3 = vec3.create();
    vec3.transformMat4(far, farMousePos, inv);

    return {
        near,
        far,
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

    const nearFarMouseCoords = calculateNearFarMouseCoords(
        hsData.sceneData, hsData.inputData);

    const near = nearFarMouseCoords.near;
    const far = nearFarMouseCoords.far;

    // Even indices are raw waveforms, odd indices are freq
    let selectedIndex: number = -1;
    let closestDistSq: number = 0.1;
    hsData.audioData.inputs.forEach((_, i) => {
        const rawPos: vec3 = [0, 3*i, 0];
        const freqPos: vec3 = [0, 3*i, 3];

        hsData.positionData.inputs[i] = {
            raw: rawPos,
            frequency: freqPos
        };

        let rawDistSq = calculateShortestDistanceSquared(rawPos, near, far);
        let freqDistSq = calculateShortestDistanceSquared(freqPos, near, far);

        if (rawDistSq < 0.1) {
            if (rawDistSq < closestDistSq) {
                closestDistSq = rawDistSq;
                selectedIndex = 2*i;
            }
        }

        if (freqDistSq < 0.1) {
            if (freqDistSq < closestDistSq) {
                closestDistSq = freqDistSq;
                selectedIndex = 2*i + 1;
            }
        }
    });

    console.log(selectedIndex);
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

import { mat4, vec2, vec3 } from "gl-matrix";
import type { ILocalAPI } from "../../interface";

import * as audio from "./audio";

import { initialiseInputList, InputListData, updateInputListSelectedItem } from "./input-list";

import { CNum } from "./math/number";

import { createViewMatFromCamera } from "./objects/camera";

import { CameraData } from "./objects/camera";

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
import { warn } from "console";

interface InputData {
    mouseWheel: {
        deltaX: number;
        deltaY: number;
    };

    deltaZoom: number;

    normalisedMousePos: vec2,

    leftMouseDown: boolean;
    rightMouseDown: boolean;
};

interface HSData {
    audioData: audio.AudioData;
    sceneData: SceneData;
    inputData: InputData;
    wasmData: WASMData;
    inputListData: InputListData;

    gl: WebGLRenderingContext;
    
    defaultShaderData: DefaultShader.Data;
    waveformShaderData: WaveformShader.Data;
    gridlinesShaderData: GridlinesShader.Data;
    squareShaderData: SquareShader.Data;

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
            deltaY: 0
        },

        normalisedMousePos: [0, 0],

        deltaZoom: 0,
        
        leftMouseDown: false,
        rightMouseDown: false,
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

        inputData.normalisedMousePos[0] = 2*(event.clientX - boundingRect.x)
            /boundingRect.width - 1.0;

        inputData.normalisedMousePos[1] = 1.0 - 2*(event.clientY - boundingRect.y)/
            boundingRect.height;
    });

    canvas.addEventListener('mousedown', (event) => {
        switch (event.button) {
            case 0:
                inputData.leftMouseDown = true;
                break;
        }
    });

    canvas.addEventListener('mouseup', (event) => {
        switch (event.button) {
            case 0:
                inputData.leftMouseDown = false;
                break;
        }
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

    const waveformPositions: vec3[] = [];

    if (isNative) {
        // Initialise positions for system audio
        waveformPositions[0] = [0.0, 0.0, 0.0];
        waveformPositions[1] = [0.0, 0.0, 2.0];
    }

    const inputListData = initialiseInputList(audioData, waveformPositions);

    const hsData: HSData =  {
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

    return hsData;
}

function updateCameraData(
    cameraData: CameraData, inputData: InputData, deltaTime: number
): mat4 {
    cameraData.xRot += inputData.mouseWheel.deltaY
        *deltaTime;

    cameraData.yRot += -inputData.mouseWheel.deltaX * deltaTime;

    cameraData.xRot = CNum.clamp(
        cameraData.xRot,
        -1/3 * Math.PI,
        1/3 * Math.PI
    );

    let viewMat = createViewMatFromCamera(
        cameraData
    );

    cameraData.radius += 5*inputData.deltaZoom * deltaTime;

    return viewMat;
}

const updateScene = (hsData: HSData) => {
    let sceneData = hsData.sceneData;
    sceneData.viewMat = updateCameraData(
        sceneData.cameraData, 
        hsData.inputData, 
        hsData.deltaTime
    );

    // Update camera rotation
    // Update position of waveforms.
    hsData.audioData.waveforms.forEach((_, i) => {
        const pos = hsData.waveformPositions[i];

        let screenSpacePos = vec3.create();
        vec3.transformMat4(
            screenSpacePos,
            pos,
            sceneData.viewMat, 
        );
        vec3.transformMat4(
            screenSpacePos,
            screenSpacePos,
            sceneData.projMat, 
        );

        hsData.waveformPositionsScreenSpace[i] = screenSpacePos;
    });

    const screenWidthHeightRatio = hsData.canvas.getBoundingClientRect().height / hsData.canvas.getBoundingClientRect().width;

    if (hsData.inputData.leftMouseDown) {
        hsData.audioData.waveforms.forEach((_, i) => {
            const screenSpacePos: vec3 = hsData.waveformPositionsScreenSpace[i];
            const mousePos: vec2 = hsData.inputData.normalisedMousePos;
            const halfDim: vec2 = [0.015*screenWidthHeightRatio, 0.015];

            let diff: vec2 = vec2.subtract(
                vec2.create(),
                mousePos, 
                vec2.fromValues(screenSpacePos[0], screenSpacePos[1])
            )

            if (diff[0] < halfDim[0] &&
                diff[0] > -halfDim[0] && 
                diff[1] < halfDim[1] &&
                diff[1] > -halfDim[1]) {
                hsData.selectedWaveformIndex = i;
            }
        });
    } else {
        hsData.selectedWaveformIndex = -1;
    }

    if (hsData.selectedWaveformIndex >= 0) {
        const worldSpaceMousePos = vec3.transformMat4(
            vec3.create(),
            vec3.fromValues(
                hsData.inputData.normalisedMousePos[0],
                hsData.inputData.normalisedMousePos[1],
                hsData.waveformPositionsScreenSpace[hsData.selectedWaveformIndex][2],
            ),
            mat4.invert(
                mat4.create(),
                sceneData.projMat
            )
        );

        vec3.transformMat4(
            worldSpaceMousePos,
            worldSpaceMousePos,
            mat4.invert(
                mat4.create(),
                sceneData.viewMat
            )
        );

        hsData.waveformPositions[hsData.selectedWaveformIndex] = worldSpaceMousePos;
    }
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

    if (hsData.selectedWaveformIndex != -1) {
        const selectedInputIndex =  
            hsData.audioData.waveforms[hsData.selectedWaveformIndex].inputIndex;
        const selectedInput = hsData.audioData.inputs[selectedInputIndex];

        const isRaw = selectedInput.rawWaveformIndex == hsData.selectedWaveformIndex;
        const isFreq = selectedInput.frequencyWaveformIndex == hsData.selectedWaveformIndex;

        let waveformType: audio.WaveformType;
        if (isRaw) {
            waveformType = audio.WaveformType.Raw;
        } else if (isFreq) {
            waveformType = audio.WaveformType.Frequency;
        } else {
            throw Error("Selected waveform was neither raw or freq.");
        }

        updateInputListSelectedItem(
            hsData.inputListData, 
            selectedInputIndex,
            waveformType
        );
    } else {
        updateInputListSelectedItem(
            hsData.inputListData, 
            -1,
        )
    }
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

import { mat4, vec3 } from "gl-matrix";
import { type HSData } from "./h-sharp";
import { renderWaveform } from "./objects/waveform";
import { CNum } from "./math/number";

interface CameraData {
    xRot: number;
    yRot: number;

    // Represents sphere on which camera is fixed.
    radius: number;

    focus: vec3;
};

interface SceneData {
    projMat: mat4;
    viewMat: mat4;

    cameraData: CameraData;
};

const initialiseScene = (
    gl: WebGLRenderingContext
): SceneData => {
    const fov = (45 * Math.PI) / 180;
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;

    return { 
        projMat: mat4.perspective(
            mat4.create(),
            fov,
            aspect,
            zNear,
            zFar
        ), 
        viewMat: mat4.create(),

        cameraData: {
            xRot: 0,
            yRot: 0,

            radius: 6,

            focus: vec3.fromValues(0, 0, 1.5),
        }
    }
}

const createViewMat = (
    cameraData: CameraData
): mat4 => {
    let viewMatOut: mat4 = new Float32Array(16);
    
    mat4.fromTranslation(
        viewMatOut,
        vec3.fromValues(0, 0, -cameraData.radius)
    );

    mat4.rotate(
        viewMatOut,
        viewMatOut,
        cameraData.xRot,
        [1, 0, 0]
    );

    mat4.rotate(
        viewMatOut,
        viewMatOut,
        cameraData.yRot,
        [0, 1, 0]
    );

    mat4.translate(
        viewMatOut,
        viewMatOut,
        vec3.scale(
            vec3.create(),
            cameraData.focus,
            -1
        )
    );

    return viewMatOut;
}

const drawScene = (
    hsData: HSData,
) => {
    let gl = hsData.gl;
    let sceneData = hsData.sceneData;

    // TODO: Find a better way to do this.
    sceneData.cameraData.xRot += hsData.inputData.mouseWheel.deltaY
        *hsData.deltaTime;

    sceneData.cameraData.yRot += -hsData.inputData.mouseWheel.deltaX * hsData.deltaTime;

    sceneData.cameraData.xRot = CNum.clamp(
        sceneData.cameraData.xRot,
        -1/3 * Math.PI,
        1/3 * Math.PI
    );

    sceneData.viewMat = createViewMat(sceneData.cameraData);

    sceneData.cameraData.radius += 5*hsData.inputData.deltaZoom * hsData.deltaTime;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renderWaveform(
        gl, 
        hsData.sceneData, 
        hsData.waveformShaderData,
        hsData.audioData.inputs[0].raw,
        [0, 0, 0]
    );

    renderWaveform(
        gl,
        hsData.sceneData,
        hsData.waveformShaderData,
        hsData.audioData.inputs[0].frequencySpectrum,
        [0, 0, 3]
    );
};

export { 
    type SceneData, 

    drawScene, 
    initialiseScene 
};

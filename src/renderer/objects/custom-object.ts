import { mat4, vec3 } from "gl-matrix";
import { SceneData } from "../scene";
import { CustomObjectShader } from "../shader";

interface CustomObject {
    buffers: CustomObjectShader.VertexBuffer;
}

function createCustomObject(
    gl: WebGLRenderingContext,
    source: string
): CustomObject {
    const win = window as typeof window & {
        frequencyBuffer: Float32Array;
        customObjectResults: CustomObjectShader.InputBuffers;
    };

    win.frequencyBuffer = new Float32Array(512).fill(0.0);

    const modifiedSource = `
    ${source}
window.customObjectResults = {
    vertices: generateVertices(window.frequencyBuffer),
    colors: generateColors(window.frequencyBuffer),
    indices: generateIndices(window.frequencyBuffer),
}
    `;

    console.log(source);

    eval(modifiedSource);

    const inputBuffers = win.customObjectResults;
    console.log(inputBuffers);

    return {
        buffers: CustomObjectShader.initialiseBuffers(gl, inputBuffers),
    };
}

function renderCustomObject(
    gl: WebGLRenderingContext,
    sceneData: SceneData,
    shader: CustomObjectShader.Data,
    object: CustomObject,
    waveform: Float32Array,
    center: vec3 = [0, 0, 0]
) {
    gl.useProgram(shader.program);

    CustomObjectShader.setPositionAttribute(gl, shader, object.buffers);
    CustomObjectShader.setColorAttribute(gl, shader, object.buffers);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.buffers.indices);

    gl.uniformMatrix4fv(
        shader.uniformLocations.projMat,
        false,
        sceneData.projMat
    );

    gl.uniformMatrix4fv(
        shader.uniformLocations.viewMat,
        false,
        sceneData.viewMat
    );

    let model = mat4.create();
    mat4.translate(model, model, center);

    gl.uniformMatrix4fv(shader.uniformLocations.modelMat, false, model);

    gl.drawElements(gl.TRIANGLES, object.buffers.indexCount, gl.UNSIGNED_SHORT, 0);
}

export { 
    type CustomObject,

    renderCustomObject, 
    createCustomObject 
};

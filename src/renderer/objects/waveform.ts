import { mat4, vec3 } from "gl-matrix";
import { SceneData } from "../scene";
import { WaveformShader } from "../shaders/waveform-shader";

const renderWaveform = (
    gl: WebGLRenderingContext,
    sceneData: SceneData,
    shader: WaveformShader.Data,
    waveform: Float32Array,
    center: vec3 = [0, 0, 0],
    max: number
) => {
    gl.useProgram(shader.program);

    // We have frequency information
    gl.bindBuffer(gl.ARRAY_BUFFER, shader.buffers.value);

    gl.bufferSubData(
        gl.ARRAY_BUFFER,
        0,
        WaveformShader.generateValues(
            100, // TODO: Make not hardcoded
            waveform,
            max
        )
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    WaveformShader.setPositionAttribute(gl, shader, shader.buffers);

    WaveformShader.setColorAttribute(gl, shader, shader.buffers);

    WaveformShader.setValueAttribute(gl, shader, shader.buffers);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shader.buffers.indices);

    gl.useProgram(shader.program);

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

    gl.drawElements(
        gl.TRIANGLES,
        shader.buffers.indexCount,
        gl.UNSIGNED_SHORT,
        0
    );
};

export { renderWaveform };

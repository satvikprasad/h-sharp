import { AWaveformData } from "../audio";
import { SceneData } from "../scene";
import { WaveformShader } from "../shaders/waveform-shader";

const renderWaveform = (
    sceneData: SceneData,
    gl: WebGLRenderingContext,
    shader: WaveformShader.Data,
    waveform: AWaveformData
) => {
    if (waveform.buffer) {
        // We have frequency information
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            shader.buffers.value,
        );

        gl.bufferSubData(
            gl.ARRAY_BUFFER,
            0,
            WaveformShader.generateValues(
                100, // TODO: Make not hardcoded
                waveform.buffer,
                waveform.timeWeightedMax,
            )
        );
    }

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    WaveformShader.setPositionAttribute(
        gl, 
        shader, 
        shader.buffers
    );

    WaveformShader.setColorAttribute(
        gl, 
        shader, 
        shader.buffers
    );

    WaveformShader.setValueAttribute(
        gl,
        shader,
        shader.buffers
    );

    gl.bindBuffer(
        gl.ELEMENT_ARRAY_BUFFER, 
        shader.buffers.indices
    );

    gl.useProgram(shader.program);

    gl.uniformMatrix4fv(
        shader.uniformLocations.projMat,
        false,
        sceneData.projMat
    );

    gl.uniformMatrix4fv(
        shader.uniformLocations.mvMat,
        false,
        sceneData.mvMat
    );

    gl.drawElements(
        gl.TRIANGLES, 
        shader.buffers.indexCount,
        gl.UNSIGNED_SHORT, 
        0
    );
}

export { renderWaveform };

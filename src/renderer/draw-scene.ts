import { mat4 } from "gl-matrix";
import { type HSData } from "./h-sharp";
import { WaveformShader } from "./shaders/waveform-shader";

const drawScene = (
    hsData: HSData,
) => {
    let gl = hsData.gl;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fov = (45 * Math.PI) / 180;
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;

    const projMat = mat4.create();
    mat4.perspective(projMat, fov, aspect, zNear, zFar);

    const mvMat = mat4.create();

    mat4.translate(
        mvMat,
        mvMat,
        [-0.0, 0.0, -6],
    );

    if (hsData.audioData.inputs[0].frequencyBuffer) {
        // We have frequency information
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            hsData.frequencyWaveformBufferData.vBuffer.value,
        );

        gl.bufferSubData(
            gl.ARRAY_BUFFER,
            0,
            WaveformShader.generateValues(
                100, 
                hsData.audioData.inputs[0].frequencyBuffer,
            )
        );
    }

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    WaveformShader.setPositionAttribute(
        gl, 
        hsData.waveformProgramInfo, 
        hsData.frequencyWaveformBufferData.vBuffer
    );

    WaveformShader.setColorAttribute(
        gl, 
        hsData.waveformProgramInfo, 
        hsData.frequencyWaveformBufferData.vBuffer
    );

    WaveformShader.setValueAttribute(
        gl,
        hsData.waveformProgramInfo,
        hsData.frequencyWaveformBufferData.vBuffer
    );

    gl.bindBuffer(
        gl.ELEMENT_ARRAY_BUFFER, 
        hsData.frequencyWaveformBufferData.vBuffer.indices
    );

    gl.useProgram(hsData.waveformProgramInfo.program);

    gl.uniformMatrix4fv(
        hsData.waveformProgramInfo.uniformLocations.projMat,
        false,
        projMat
    );

    gl.uniformMatrix4fv(
        hsData.waveformProgramInfo.uniformLocations.mvMat,
        false,
        mvMat
    );

    gl.drawElements(
        gl.TRIANGLES, 
        hsData.frequencyWaveformBufferData.indexCount,
        gl.UNSIGNED_SHORT, 
        0
    );
};

export { drawScene };

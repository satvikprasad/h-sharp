import { mat4 } from "gl-matrix";
import { VertexBuffer } from "./init-buffers";
import { ProgramInfo } from "./shader";

// Temporary
let t = 0;

const drawScene = (
    gl: WebGLRenderingContext,
    programInfo: ProgramInfo,
    buffers: VertexBuffer,
    t: number,
) => {
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

    mat4.rotate(
        mvMat,
        mvMat,
        t,
        [0, 1, 0]
    );

    const positions = [
        1.0, t, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0,
    ];
    t += 0.1;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(positions));

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setPositionAttribute(gl, programInfo, buffers);
    setColorAttribute(gl, programInfo, buffers);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projMat,
        false,
        projMat
    );

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.mvMat,
        false,
        mvMat
    );

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
};

const setPositionAttribute = (
    gl: WebGLRenderingContext,
    programInfo: ProgramInfo,
    buffers: VertexBuffer
) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

const setColorAttribute = (
    gl: WebGLRenderingContext,
    programInfo: ProgramInfo,
    buffers: VertexBuffer
) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);

    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

export { drawScene };

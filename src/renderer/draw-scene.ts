import { mat4 } from "gl-matrix";
import { VertexBuffer } from "./init-buffers";
import { ProgramInfo } from "./shader";

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


    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setPositionAttribute(gl, programInfo, buffers);
    setColorAttribute(gl, programInfo, buffers);

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

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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

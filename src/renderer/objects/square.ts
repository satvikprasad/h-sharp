import { vec2, vec4 } from "gl-matrix";
import { SquareShader } from "../shaders/square-shader";

const renderSquare = (
    gl: WebGLRenderingContext,
    shader: SquareShader.Data,
    pos: vec2,
    scale: vec2,
    color: vec4,
) => {
    gl.useProgram(shader.program);

    SquareShader.setPositionAttribute(gl, shader, shader.positionBuffer);

    gl.uniform3fv(shader.uniformLocations.position, [...pos, 0]);
    gl.uniform2fv(shader.uniformLocations.scale, scale);
    gl.uniform4fv(shader.uniformLocations.color, color);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export { renderSquare };

import { vec2 } from "gl-matrix";
import { SquareShader } from "../shaders/square-shader";

const renderPixel = (
    gl: WebGLRenderingContext,
    shader: SquareShader.Data,
    pos: vec2
) => {
    gl.useProgram(shader.program);

    SquareShader.setPositionAttribute(gl, shader, shader.positionBuffer);

    gl.uniform3fv(shader.uniformLocations.position, [...pos, 0]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export { renderPixel };

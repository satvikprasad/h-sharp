import { mat4, vec4 } from "gl-matrix";
import { SceneData } from "../scene";
import { GridlinesShader } from "../shaders/gridlines-shader";

const renderGridlines = (
    gl: WebGLRenderingContext,
    sceneData: SceneData,
    shader: GridlinesShader.Data,
    color: vec4,
    width: number,
    density: number
) => {
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

    gl.uniform4f(
        shader.uniformLocations.color,
        color[0],
        color[1],
        color[2],
        color[3]
    );

    gl.uniform1f(shader.uniformLocations.scale, density);

    gl.uniform1f(shader.uniformLocations.width, width);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
};

export { renderGridlines };

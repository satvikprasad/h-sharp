import { mat4 } from "gl-matrix";
import { SceneData } from "../scene";
import { GridlinesShader } from "../shaders/gridlines-shader";

const renderGridlines = (
    gl: WebGLRenderingContext,
    sceneData: SceneData,
    shader: GridlinesShader.Data,
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

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        6,
    );
}

export { renderGridlines };

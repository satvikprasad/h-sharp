import { mat4 } from "gl-matrix";
import { SceneData } from "../scene";
import { GridlinesShader } from "../shaders/gridlines-shader";

const renderGridlines = (
    gl: WebGLRenderingContext,
    sceneData: SceneData,
    shader: GridlinesShader.Data,
    size: number,
) => {
    gl.useProgram(shader.program);

    GridlinesShader.setPositionAttribute(
        gl,
        shader,
        shader.buffers,
    );

    GridlinesShader.setColorAttribute(
        gl, 
        shader,
        shader.buffers
    );

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

    let modelMat = mat4.create();
    mat4.scale(
        modelMat,
        modelMat,
        [size, size, size],
    );

    gl.uniformMatrix4fv(
        shader.uniformLocations.modelMat,
        false,
        modelMat,
    );

    gl.drawArrays(
        gl.LINES,
        0,
        shader.buffers.positionCount,
    );
}

export { renderGridlines };

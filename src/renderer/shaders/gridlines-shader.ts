import { vec4 } from "gl-matrix";
import { IFileSystemAPI } from "../../../interface";
import { initShaderProgram } from "../shader";

// TODO: Convert all Array<number> operations here to 
// Float32Array operations.

namespace GridlinesShader {
    export interface Data {
        program: WebGLProgram;

        uniformLocations: {
            projMat: WebGLUniformLocation;
            viewMat: WebGLUniformLocation;
        };
    };

    const getData = (
        gl: WebGLRenderingContext,
        program: WebGLProgram,
    ) => {
        const projMatLoc = gl.getUniformLocation(
            program,
            "uProjectionMatrix"
        );

        const viewMatLoc = gl.getUniformLocation(
            program,
            "uViewMatrix"
        );

        if (!projMatLoc) {
            throw Error(`Could not find uniform location\
            for uProjectionMatrix`);
        }

        if (!viewMatLoc) {
            throw Error(`Could not find uniform location\
            for uViewMatrix`);
        }

        return {
            program: program,
            uniformLocations: {
                projMat: projMatLoc,
                viewMat: viewMatLoc,
            },
        };
    }

    export const initialise = async (
        gl: WebGLRenderingContext,
        fs: IFileSystemAPI,
    ): Promise<Data> => {
        const program = await initShaderProgram(
            gl,
            "gridlines-vertex.glsl",
            "gridlines-fragment.glsl",
            fs
        );

        if (program == null) {
            throw Error(
                `Exiting. H-Sharp was unable to initialise the gridlines shader program.`
            );
        }

        return getData(gl, program);
    }
};

export { GridlinesShader };

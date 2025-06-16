import { vec4 } from "gl-matrix";
import { IFileSystemAPI } from "../../../interface";
import { initShaderProgram } from "../shader";

import vertexURL from './source/gridlines-vertex.glsl?url';
import fragmentURL from './source/gridlines-fragment.glsl?url';

// TODO: Convert all Array<number> operations here to 
// Float32Array operations.

namespace GridlinesShader {
    export interface Data {
        program: WebGLProgram;

        uniformLocations: {
            projMat: WebGLUniformLocation;
            viewMat: WebGLUniformLocation;
            color: WebGLUniformLocation;
            scale: WebGLUniformLocation;
            width: WebGLUniformLocation;
        };
    };

    const getData = (
        gl: WebGLRenderingContext,
        program: WebGLProgram,
    ) => {
        const projMatLoc = gl.getUniformLocation(
            program,
            "uProjMat"
        );

        if (!projMatLoc) {
            throw Error(`Could not find uniform location\
            for uProjMat`);
        }

        const viewMatLoc = gl.getUniformLocation(
            program,
            "uViewMat"
        );

        if (!viewMatLoc) {
            throw Error(`Could not find uniform location\
            for uViewMat`);
        }

        const colorLoc = gl.getUniformLocation(
            program,
            "uColor"
        );

        if (!colorLoc) {
            throw Error(`Could not find uniform location\
            for uColor`);
        }

        const scaleLoc = gl.getUniformLocation(
            program,
            "uScale"
        );

        if (!scaleLoc) {
            throw Error(`Could not find uniform location\
            for uScale`);
        }

        const widthLoc = gl.getUniformLocation(
            program,
            "uWidth"
        );

        if (!widthLoc) {
            throw Error(`Could not find uniform location\
            for uWidth`);
        }

        return {
            program: program,
            uniformLocations: {
                projMat: projMatLoc,
                viewMat: viewMatLoc,
                color: colorLoc,
                scale: scaleLoc,
                width: widthLoc,
            },
        };
    }

    export const initialise = async (
        gl: WebGLRenderingContext,
        fs: IFileSystemAPI,
    ): Promise<Data> => {
        const program = await initShaderProgram(
            gl,
            vertexURL,
            fragmentURL,
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

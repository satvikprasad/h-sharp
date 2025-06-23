import { IFileSystemAPI } from "../../../interface";
import { initShaderProgram } from "../shader";

import vertexURL from "./source/custom-object-vertex.glsl?url";
import fragmentURL from "./source/custom-object-fragment.glsl?url";

import defaultScripting from "./custom-object-default-scripting?raw";

// TODO: Convert all Array<number> operations here to
// Float32Array operations.

namespace CustomObjectShader {
    export interface InputBuffers {
        vertices: Float32Array;
        colors: Float32Array;
        indices: [Uint16Array, number];
    }

    export interface Data {
        program: WebGLProgram;

        attribLocations: {
            vertexPosition: GLint;
            vertexColor: GLint;
        };

        uniformLocations: {
            projMat: WebGLUniformLocation;
            viewMat: WebGLUniformLocation;
            modelMat: WebGLUniformLocation;
        };

        buffers: VertexBuffer;
    }

    export interface VertexBuffer {
        position: WebGLBuffer;
        color: WebGLBuffer;

        indices: WebGLBuffer;
        indexCount: number;
    }

    const initColorBuffer = (
        gl: WebGLRenderingContext,
        colors: Float32Array
    ): WebGLBuffer => {
        const colorBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

        return colorBuffer;
    };

    const initPositionBuffer = (
        gl: WebGLRenderingContext,
        vertices: Float32Array
    ): WebGLBuffer => {
        const posBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        return posBuffer;
    };

    const initIndexBuffer = (
        gl: WebGLRenderingContext,
        indices: [Uint16Array, number]
    ): [WebGLBuffer, number] => {
        const indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        const [buf, count] = indices;

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buf, gl.STATIC_DRAW);

        return [indexBuffer, count];
    };

    const initBuffers = (
        gl: WebGLRenderingContext,
        buffers: InputBuffers
    ): VertexBuffer => {
        let [indexBuffer, indexCount] = initIndexBuffer(gl, buffers.indices);

        return {
            position: initPositionBuffer(gl, buffers.vertices),
            color: initColorBuffer(gl, buffers.colors),
            indices: indexBuffer,
            indexCount: indexCount,
        };
    };

    export const setPositionAttribute = (
        gl: WebGLRenderingContext,
        data: Data,
        buffers: VertexBuffer
    ) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

        gl.vertexAttribPointer(
            data.attribLocations.vertexPosition,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.enableVertexAttribArray(data.attribLocations.vertexPosition);
    };

    export const setColorAttribute = (
        gl: WebGLRenderingContext,
        data: Data,
        buffers: VertexBuffer
    ) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);

        gl.vertexAttribPointer(
            data.attribLocations.vertexColor,
            4,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.enableVertexAttribArray(data.attribLocations.vertexColor);
    };

    export const getData = (
        gl: WebGLRenderingContext,
        program: WebGLProgram,
        buffers: InputBuffers
    ): Data => {
        const projMatLoc = gl.getUniformLocation(program, "uProjectionMatrix");

        const viewMatLoc = gl.getUniformLocation(program, "uViewMatrix");

        const modelMatLoc = gl.getUniformLocation(program, "uModelMatrix");

        if (!projMatLoc) {
            throw Error(`Could not find uniform location\
            for uProjectionMatrix`);
        }

        if (!viewMatLoc) {
            throw Error(`Could not find uniform location\
            for uViewMatrix`);
        }

        if (!modelMatLoc) {
            throw Error(`Could not find uniform location\
            for uModelMatrix`);
        }

        return {
            program: program,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(
                    program,
                    "aVertexPosition"
                ),
                vertexColor: gl.getAttribLocation(program, "aVertexColor"),
            },
            uniformLocations: {
                projMat: projMatLoc,
                viewMat: viewMatLoc,
                modelMat: modelMatLoc,
            },

            buffers: initBuffers(gl, buffers),
        };
    };

    export const initialise = async (
        gl: WebGLRenderingContext,
        fs: IFileSystemAPI,
        buffers: InputBuffers
    ): Promise<Data> => {
        const program = await initShaderProgram(gl, vertexURL, fragmentURL, fs);

        if (program == null) {
            throw Error(
                `Exiting. H-Sharp was unable to initialise the waveform shader program.`
            );
        }

        return getData(gl, program, buffers);
    };

    export function getDefaultCustomScripting(): string {
        return defaultScripting;
    }
}

export { CustomObjectShader };

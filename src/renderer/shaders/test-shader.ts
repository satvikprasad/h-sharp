import { IFileSystemAPI } from "../../../interface";
import { initShaderProgram } from "../shader";

namespace TestShader {
    export interface Data {
        program: WebGLProgram;

        attribLocations: {
            vertexPosition: GLint;
            vertexColor: GLint;
        };

        uniformLocations: {
            projMat: WebGLUniformLocation;
            mvMat: WebGLUniformLocation;
        };
    };

    export interface VertexBuffer {
        position: WebGLBuffer,
        color: WebGLBuffer,
        indices: WebGLBuffer,
    };

    export const initBuffers = (
        gl: WebGLRenderingContext
    ): VertexBuffer => {
        return {
            position: initPositionBuffer(gl),
            color: initColorBuffer(gl),
            indices: initIndexBuffer(gl),
        };
    }

    const initColorBuffer = (
        gl: WebGLRenderingContext
    ): WebGLBuffer => {
        const colors = [
            1.0, 1.0, 1.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0
        ];

        const colorBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(colors),
            gl.STATIC_DRAW
        );

        return colorBuffer;
    }

    const initPositionBuffer = (
        gl: WebGLRenderingContext
    ): WebGLBuffer => {
        const posBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

        const positions = [
            1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0,
            1.0, -1.0, 0.0,
            -1.0, -1.0, 0.0,
        ];

        gl.bufferData(
            gl.ARRAY_BUFFER, 
            new Float32Array(positions), 
            gl.STATIC_DRAW
        );

        return posBuffer;
    }

    const initIndexBuffer = (
        gl: WebGLRenderingContext
    ): WebGLBuffer => {
        const indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        const indices = [
            0, 1, 2,
            1, 2, 3
        ];

        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices), // NOTE: Type here must match type in draw-scene.ts
            gl.STATIC_DRAW
        );

        return indexBuffer;
    }

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
    }

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
    }

    const getData = (
        gl: WebGLRenderingContext,
        program: WebGLProgram
    ): Data => {
        const projMatLoc = gl.getUniformLocation(
            program, "uProjectionMatrix");
        const mvMatLoc = gl.getUniformLocation(
            program, "uModelViewMatrix");

        if (!projMatLoc) {
            throw Error(`Could not find uniform location\
            for uProjectionMatrix`);
        }

        if (!mvMatLoc) {
            throw Error(`Could not find uniform location\
            for uModelViewMatrix`);
        }

        return {
            program: program,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(
                    program, "aVertexPosition"),
                vertexColor: gl.getAttribLocation(
                    program, "aVertexColor"),
            },
            uniformLocations: {
                projMat: projMatLoc,
                mvMat: mvMatLoc,
            },
        };
    }

    export const initialise = async (
        gl: WebGLRenderingContext,
        fs: IFileSystemAPI
    ): Promise<Data> => {
        const program = await initShaderProgram(
            gl,
            "vertex-shader.glsl",
            "fragment-shader.glsl",
            fs,
        );

        if (program == null) {
            throw Error(`Exiting as h-sharp was unable to initialise the default shader program.`);
        }

        return getData(gl, program);
    }
};

export { TestShader };

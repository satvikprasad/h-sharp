import { IFileSystemAPI } from "../../../interface";
import { initShaderProgram } from "../shader";

namespace WaveformShader {
    export interface Data {
        program: WebGLProgram;

        attribLocations: {
            vertexPosition: GLint;
            vertexColor: GLint;
            vertexValue: GLint;
        };

        uniformLocations: {
            projMat: WebGLUniformLocation;
            mvMat: WebGLUniformLocation;
        };

        buffers: VertexBuffer;
    };

    export interface VertexBuffer {
        position: WebGLBuffer,
        color: WebGLBuffer,
        value: WebGLBuffer,

        indices: WebGLBuffer,
        indexCount: number,
    };

    export const generateValues = (
        fidelity: number,
        frequencyBuffer?: Array<number>,
    ): Float32Array => {
        let values: Array<number> = [];

        let max: number = 1.0;

        if (frequencyBuffer) {
            max = Math.max(...frequencyBuffer);
        }

        // No frequency buffer provided
        for (let k = 0; k <= fidelity; ++k) {
            if (frequencyBuffer) {
                let i = Math.floor(
                    k/fidelity * frequencyBuffer.length
                );

                i = Math.min(frequencyBuffer.length, i);

                // Push normalised value.
                values.push(
                    0,
                    frequencyBuffer[i]/max // Normalising         
                );
            } else {
                values.push(0);
                values.push(1);
            }
        }

        return new Float32Array(values);
    }

    const generateVertices = (
        fidelity: number,
    ): Float32Array => {
        let positions: Array<number> = [];

        // No frequency buffer provided
        for (let k = 0; k <= fidelity; ++k) {
            let x = k/fidelity * 2.0 - 1.0;

            positions.push(
                x, 0.0, 0.0, 
                x, 0.0, 0.0
            );
        }

        return new Float32Array(positions);
    }

    const generateColors = (
        fidelity: number
    ): Float32Array => {
        let colors: Array<number> = [];

        for (let k = 0; k <= fidelity; ++k) {
            let t = k/fidelity;

            colors.push(1.0, 1.0, t, 1.0);
            colors.push(1.0, 1.0, t, 1.0);
        }

        return new Float32Array(colors);
    }

    const generateIndices = (
        fidelity: number
    ): { 
        indices: Uint16Array,
            indexCount: number
    } => {
        let indices: Array<number> = [];

        for (let k = 0; k < fidelity; ++k) {
            // 2*k is the base, 2*k + 1 is the tip
            indices.push(2*k, 2*k + 1, 2*k + 2);
            indices.push(2*k + 1, 2*k + 2, 2*k + 3);
        }

        return { 
            indices: new Uint16Array(indices),
            indexCount: indices.length,
        }
    }

    const initValueBuffer = (
        gl: WebGLRenderingContext,
        fidelity: number
    ) => {
        const valueBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, valueBuffer);

        gl.bufferData(
            gl.ARRAY_BUFFER,
            generateValues(fidelity),
            gl.STATIC_DRAW
        );

        return valueBuffer;
    }

    const initColorBuffer = (
        gl: WebGLRenderingContext,
        fidelity: number,
    ): WebGLBuffer => {
        const colorBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        gl.bufferData(
            gl.ARRAY_BUFFER,
            generateColors(fidelity),
            gl.STATIC_DRAW
        );

        return colorBuffer;
    }

    const initPositionBuffer = (
        gl: WebGLRenderingContext,
        fidelity: number,
    ): WebGLBuffer => {
        const posBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

        gl.bufferData(
            gl.ARRAY_BUFFER, 
            generateVertices(fidelity), 
            gl.STATIC_DRAW
        );

        return posBuffer;
    }

    const initIndexBuffer = (
        gl: WebGLRenderingContext,
        fidelity: number,
    ): {
        indexBuffer: WebGLBuffer,
            indexCount: number,
    } => {
        const indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        let indexOut = generateIndices(fidelity);

        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            indexOut.indices,
            gl.STATIC_DRAW
        );

        return { 
            indexBuffer: indexBuffer, 
            indexCount: indexOut.indexCount 
        };
    }

    export const initBuffers = (
        gl: WebGLRenderingContext,
        fidelity: number,
    ): VertexBuffer => {
        let indexOut = initIndexBuffer(gl, fidelity);

        return {
            position: initPositionBuffer(gl, fidelity),
            value: initValueBuffer(gl, fidelity),
            color: initColorBuffer(gl, fidelity),
            indices: indexOut.indexBuffer,
            indexCount: indexOut.indexCount,
        };
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

    export const setValueAttribute = (
        gl: WebGLRenderingContext,
        data: Data,
        buffers: VertexBuffer
    ) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.value);

        gl.vertexAttribPointer(
            data.attribLocations.vertexValue,
            1,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.enableVertexAttribArray(
            data.attribLocations.vertexValue
        );
    }

    export const getData = (
        gl: WebGLRenderingContext,
        program: WebGLProgram,
        fidelity: number,
    ) => {
        const projMatLoc = gl.getUniformLocation(
            program,
            "uProjectionMatrix"
        );

        const mvMatLoc = gl.getUniformLocation(
            program,
            "uModelViewMatrix"
        );

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
                    program,
                    "aVertexPosition"
                ),
                vertexColor: gl.getAttribLocation(
                    program,
                    "aVertexColor"
                ),
                vertexValue: gl.getAttribLocation(
                    program,
                    "aVertexValue"
                ),
            },
            uniformLocations: {
                projMat: projMatLoc,
                mvMat: mvMatLoc,
            },

            buffers: initBuffers(gl, fidelity),
        };
    }

    export const initialise = async (
        gl: WebGLRenderingContext,
        fs: IFileSystemAPI,
        fidelity: number,
    ): Promise<Data> => {
        const program = await initShaderProgram(
            gl,
            "waveform-vertex.glsl",
            "waveform-fragment.glsl",
            fs
        );

        if (program == null) {
            throw Error(
                `Exiting. H-Sharp was unable to initialise the waveform shader program.`
            );
        }

        return getData(gl, program, fidelity);
    }
};

export { WaveformShader };

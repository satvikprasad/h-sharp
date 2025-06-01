import { vec4 } from "gl-matrix";
import { IFileSystemAPI } from "../../../interface";
import { initShaderProgram } from "../shader";

// TODO: Convert all Array<number> operations here to 
// Float32Array operations.

namespace GridlinesShader {
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
    };

    export interface VertexBuffer {
        position: WebGLBuffer,
        color: WebGLBuffer,
        positionCount: number,
    };

    /**
     * GridlinesShader.generateVertices: Generates (density+1)*4 
     * vertices, each composed of 3 floats. Order is 
     * x-gridline-start, x-gridline-end, 
     * z-gridline-start, z-gridline-end.
     * @param number density The number of gridlines per unit
     * @return void
     */
    const generateVertices = (
        density: number,
    ): { 
        positions: Float32Array, 
        positionCount: number 
    } => {
        let positions: Array<number> = [];

        // No frequency buffer provided
        for (let k = 0; k <= density; ++k) {
            let x = k/density - 0.5;

            positions.push(
                x, 0.0, -0.5, 
                x, 0.0, 0.5
            );

            positions.push(
                -0.5, 0.0, x,
                0.5, 0.0, x,
            );

            console.log(x);
        }

        return { 
            positions: new Float32Array(positions), 
            positionCount: (density + 1)*4 
        };
    }

    /**
     * GridlinesShader.generateColors: Fills vertex colors with
     * specified color.
     * @param number density The number of gridlines per unit
     * @param glmatrix.vec4 color The color of the gridlines.
     * @returns void
     **/
    const generateColors = (
        density: number,
        color: vec4
    ): Float32Array => {
        let colors: Array<number> = [];

        for (let k = 0; k <= density; ++k) {
            colors.push(...color);
            colors.push(...color);
            colors.push(...color);
            colors.push(...color);
        }

        return new Float32Array(colors);
    }

    const initColorBuffer = (
        gl: WebGLRenderingContext,
        density: number,
        color: vec4,
    ): WebGLBuffer => {
        const colorBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        gl.bufferData(
            gl.ARRAY_BUFFER,
            generateColors(density, color),
            gl.STATIC_DRAW
        );

        return colorBuffer;
    }

    const initPositionBuffer = (
        gl: WebGLRenderingContext,
        fidelity: number,
    ): {
        buffer: WebGLBuffer,
        positionCount: number,
    } => {
        const posBuffer = gl.createBuffer();
        const vertices = generateVertices(fidelity);

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

        gl.bufferData(
            gl.ARRAY_BUFFER, 
            vertices.positions, 
            gl.STATIC_DRAW
        );

        return { 
            buffer: posBuffer, 
            positionCount: vertices.positionCount 
        };
    }

    const initBuffers = (
        gl: WebGLRenderingContext,
        density: number,
        color: vec4,
    ): VertexBuffer => {
        let positionOut = initPositionBuffer(gl, density);
        return {
            position: positionOut.buffer,
            positionCount: positionOut.positionCount,

            color: initColorBuffer(gl, density, color),
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

    const getData = (
        gl: WebGLRenderingContext,
        program: WebGLProgram,
        density: number,
        color: vec4,
    ) => {
        const projMatLoc = gl.getUniformLocation(
            program,
            "uProjectionMatrix"
        );

        const viewMatLoc = gl.getUniformLocation(
            program,
            "uViewMatrix"
        );

        const modelMatLoc = gl.getUniformLocation(
            program,
            "uModelMatrix"
        );

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
                vertexColor: gl.getAttribLocation(
                    program,
                    "aVertexColor"
                ),
            },
            uniformLocations: {
                projMat: projMatLoc,
                viewMat: viewMatLoc,
                modelMat: modelMatLoc,
            },

            buffers: initBuffers(gl, density, color),
        };
    }

    export const initialise = async (
        gl: WebGLRenderingContext,
        fs: IFileSystemAPI,
        density: number,
        color: vec4
    ): Promise<Data> => {
        const program = await initShaderProgram(
            gl,
            "default-vertex.glsl",
            "default-fragment.glsl",
            fs
        );

        if (program == null) {
            throw Error(
                `Exiting. H-Sharp was unable to initialise the gridlines shader program.`
            );
        }

        return getData(gl, program, density, color);
    }
};

export { GridlinesShader };

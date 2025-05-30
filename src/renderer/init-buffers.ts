interface VertexBuffer {
    position: WebGLBuffer,
    color: WebGLBuffer,
    indices: WebGLBuffer,
};

namespace TestBuffer {
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
};

namespace FrequencyWaveformBuffer {
    export const generateVertices = (
        fidelity: number,
        frequencyBuffer?: Array<number>,
    ): Float32Array => {
        let positions: Array<number> = [];

        // No frequency buffer provided
        for (let k = 0; k <= fidelity; ++k) {
            let x = k/fidelity * 2.0 - 1.0;

            positions.push(x, 0.0, 0.0);

            if (!frequencyBuffer) {
                positions.push(x, 1.0, 0.0);
            } else {
                let i = Math.floor(k/fidelity * frequencyBuffer.length);
                i = Math.min(i, frequencyBuffer.length - 1); // Ensure no overflow

                positions.push(x, frequencyBuffer[i], 0.0);
            }
        }

        return new Float32Array(positions);
    }

    const generateColors = (
        fidelity: number
    ): Float32Array => {
        let colors: Array<number> = [];

        for (let k = 0; k <= fidelity; ++k) {
            let t = k/fidelity;

            colors.push(t, 0.0, 0, 1.0);
            colors.push(t, 0.0, t^2, 1.0);
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

        console.log(...indexOut.indices);

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
    ): { 
        vBuffer: VertexBuffer,
        indexCount: number,
    } => {
        let indexOut = initIndexBuffer(gl, fidelity);

        return {
            vBuffer: {
                position: initPositionBuffer(gl, fidelity),
                color: initColorBuffer(gl, fidelity),
                indices: indexOut.indexBuffer,
            },
            indexCount: indexOut.indexCount,
        };
    }
};

export { 
    type VertexBuffer,

    TestBuffer,
    FrequencyWaveformBuffer,
};

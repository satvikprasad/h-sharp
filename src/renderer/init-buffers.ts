interface VertexBuffer {
    position: WebGLBuffer,
    color: WebGLBuffer,
    indices: WebGLBuffer,
};

const initBuffers = (
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
    const idxBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);

    const indices = [
        0, 1, 2,
        1, 2, 3
    ];

    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );

    return idxBuffer;
}

export { initBuffers, VertexBuffer };

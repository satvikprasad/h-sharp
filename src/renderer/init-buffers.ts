interface VertexBuffer {
    position: WebGLBuffer,
    color: WebGLBuffer,
};

const initBuffers = (
    gl: WebGLRenderingContext
): VertexBuffer => {
    return {
        position: initPositionBuffer(gl),
        color: initColorBuffer(gl)
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
        1.0, 1.0, 
        -1.0, 1.0,
        1.0, -1.0,
        -1.0, -1.0
    ];

    gl.bufferData(
        gl.ARRAY_BUFFER, 
        new Float32Array(positions), 
        gl.STATIC_DRAW
    );

    return posBuffer;
}

export { initBuffers, VertexBuffer };

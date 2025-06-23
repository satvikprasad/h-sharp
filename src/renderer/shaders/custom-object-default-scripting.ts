const fidelity = 512;

const generateVertices = (
    frequencyBuffer: Float32Array
): Float32Array => {
    let vertices: number[] = [];

    for (let k = 0; k <= fidelity; ++k) {
        let i = Math.floor((k / fidelity) * (frequencyBuffer.length - 1));

        i = Math.min(frequencyBuffer.length, i);

        // Push normalised value.
        vertices.push(k/fidelity, 0, 0);
        vertices.push(k/fidelity, 1, 0);
    }

    return new Float32Array(vertices);
};

const generateColors = (frequencyBuffer: Float32Array): Float32Array => {
    let colors: number[] = [];

    for (let k = 0; k <= fidelity; ++k) {
        let t = k / fidelity;

        colors.push(1.0, 1.0, t, 1.0);
        colors.push(1.0, 1.0, t, 1.0);
    }

    return new Float32Array(colors);
};

const generateIndices = (
    frequencyBuffer: Float32Array
): [Uint16Array, number] => {
    let indices: number[] = [];

    for (let k = 0; k < fidelity; ++k) {
        // 2*k is the base, 2*k + 1 is the tip
        indices.push(2 * k, 2 * k + 1, 2 * k + 2);
        indices.push(2 * k + 1, 2 * k + 2, 2 * k + 3);
    }

    return [new Uint16Array(indices), indices.length];
};

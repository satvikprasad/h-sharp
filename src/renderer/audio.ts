import { CMath as cx } from "./math/complex";
import { CNum as cn } from "./math/number";

export enum AType {
    MIDI = 0,
        Audio,
};

interface AInput {
    buffer: Float32Array | null;
    frequencyBuffer: Float32Array | null;
    sampleRate: number,
    audioType: AType;
};

interface AData {
    inputs: AInput[]
};

const initialiseAudioData = (): AData => {
    let systemAudioInput: AInput = {
        sampleRate: 44100,
        buffer: null,
        frequencyBuffer: null,
        audioType: AType.Audio,
    }

    // Guarantees first element is system audio
    return {
        inputs: [systemAudioInput]
    };
}

const fastFourierTransform = (
    input: Array<cx.CInt>,
    N: number,
    stride: number = 1,
): Array<cx.CInt> => {
    if (N == 1) {
        return Array.from([input[0]]);
    }

    // Compute integer division
    if (N/2 % 1 != 0) {
        throw Error("FFT: Input length was not a power of 2.");
    }

    let halfN = N/2;

    let even = fastFourierTransform(input, halfN, 2*stride);
    let odd = fastFourierTransform(input.slice(stride, input.length), halfN, 2*stride);

    let out = new Array<cx.CInt>(N).fill(cx.fromReal(0));

    for (let k = 0; k < halfN; ++k) {
        let p = even[k];
        let q = cx.multiply(odd[k], cx.fromPolar(1, -2*Math.PI * k/N));

        out[k] = cx.add(p, q);
        out[k + halfN] = cx.add(p, cx.multiply(cx.fromReal(-1), q))
    }

    return out;
}

const generateFrequencyBufferFromInput = (
    input: AInput
): Float32Array => {
    if (input.buffer == null) {
        return new Float32Array([]);
    }

    let N = cn.floorPow2(input.buffer.length);

    let cxBuffer: Array<cx.CInt> = [];

    switch (input.audioType) {
        case AType.Audio: 
            let arr = cx.fromRealArray([...input.buffer].slice(0, N));

            cxBuffer = fastFourierTransform(
                arr, 
                N, 
            );
            break;
        default: 
            return new Float32Array([]);
    }

    // Symmetry of fft
    cxBuffer = cxBuffer.slice(0, N/2);

    let phi = N/2 - 1;
    let k = 0.015;
    let a = phi/(Math.exp(k*phi) - 1)
    let b = -a

    cxBuffer = cxBuffer.map((_v, i) => {
        return cxBuffer[Math.floor(a*Math.exp(k*i) - a)]
    });

    let reBuffer = cxBuffer.map((v) => cx.mod(v));

    return new Float32Array(reBuffer);
}

const updateAudioData = (
    audioData: AData
) => {
    audioData.inputs[0].frequencyBuffer = 
        generateFrequencyBufferFromInput(audioData.inputs[0]);
}

const updateSystemAudioData = (
    audioData: AData,
    sysAudioBuffer: Float32Array
) => {
    audioData.inputs[0].buffer = sysAudioBuffer;
}

export { 
    type AData,

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData,
};

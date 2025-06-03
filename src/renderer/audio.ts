import { CMath as cx } from "./math/complex";
import { CNum as cn } from "./math/number";
import { DoubleStack, DoubleStackNode } from "./structures/double-stack";
import { WASMData } from "./wasm";

export enum AType {
    MIDI = 0,
    Audio,
};

interface AWaveformData {
    buffer: Float32Array | null;

    maximums: DoubleStack<number>;
    rollingMaximum: DoubleStack<number>;

    timeWeightedMax: number;

    numMaximums: number;
};

interface AInput {
    raw: AWaveformData;
    frequencySpectrum: AWaveformData;

    sampleRate: number,
    audioType: AType;
};

interface AData {
    inputs: AInput[]
};

const initWaveformData = (
    numMaximums: number
): AWaveformData => {
    return {
        buffer: null,

        maximums: new DoubleStack<number>(),
        rollingMaximum: new DoubleStack<number>(),

        timeWeightedMax: 0,

        numMaximums
    }
}

const initialiseAudioData = (): AData => {
    let systemAudioInput: AInput = {
        sampleRate: 44100,
        raw: initWaveformData(4),
        frequencySpectrum: initWaveformData(512),
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

const updateFrequencySpectrumForInput = (
    input: AInput
) => {
    // Update buffer
    if (input.raw.buffer == null) {
        return 
    }

    let N = cn.floorPow2(input.raw.buffer.length);

    let cxBuffer: Array<cx.CInt> = [];

    switch (input.audioType) {
        case AType.Audio: 
            let arr = cx.fromRealArray([...input.raw.buffer].slice(0, N));

            cxBuffer = fastFourierTransform(
                arr, 
                N, 
            );
            break;
        default: 
            return
    }

    // Symmetry of fft
    cxBuffer = cxBuffer.slice(0, N/2);

    let phi = N/2 - 1;
    let k = 0.019;
    let a = phi/(Math.exp(k*phi) - 1)
    let b = -a

    cxBuffer = cxBuffer.map((_v, i) => {
        return cxBuffer[Math.floor(a*Math.exp(k*i) - a)]
    });

    let reBuffer = cxBuffer.map((v) => cx.mod(v));

    input.frequencySpectrum.buffer = new Float32Array(reBuffer);

    // Update maximums
    updateMaximums(input.frequencySpectrum);
    //updateMaximums(input.raw);
}

const updateMaximums = (waveformData: AWaveformData) => {
    if (!waveformData.buffer) {
        return;
    }

    let currMax = Math.max(...waveformData.buffer);
    waveformData.maximums.pushBack(currMax);
    waveformData.rollingMaximum.pushBack(currMax);

    if (waveformData.maximums.length != 
        waveformData.rollingMaximum.length) {
        throw Error("maximums.length != rollingMaximum.length");
    }

    if (waveformData.maximums.length > 
        waveformData.numMaximums) {
        // Exceeded length
        waveformData.maximums.popFront();
        let popped = waveformData.rollingMaximum.popFront();

        if (popped == null) {
            throw Error("Contradiction while updating maximums");
        }

        waveformData.timeWeightedMax = popped;
    } else {
        let read = waveformData.rollingMaximum.readFront();

        if (read) {
            waveformData.timeWeightedMax = read;
        }
    }

    waveformData.rollingMaximum.iterateBackwards(
        (node: DoubleStackNode<number>) => {
            if (currMax >= node.data) {
                node.data = currMax
                return true
            }

            return false
        })
}

const updateInput = (
    input: AInput
) => {
    updateFrequencySpectrumForInput(input);
}

const updateAudioData = (
    audioData: AData
) => {
    for (let k = 0; k < audioData.inputs.length; ++k) {
        updateInput(audioData.inputs[k]);
    }
}

const updateSystemAudioData = (
    audioData: AData,
    sysAudioBuffer: Float32Array
) => {
    audioData.inputs[0].raw.buffer = sysAudioBuffer;
}

export { 
    type AData,
    type AInput,
    type AWaveformData,

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData,
};

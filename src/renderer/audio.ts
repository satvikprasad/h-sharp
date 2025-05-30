import { CMath as cx } from "./math/complex";

export enum AType {
    MIDI = 0,
        Audio,
};

interface AInput {
    buffer: Array<number> | null;
    frequencyBuffer: Array<number> | null;
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
    let halfN = Math.floor(N/2);

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
): Array<number> => {
    if (input.buffer == null) {
        return [];
    }

    let cxBuffer: Array<cx.CInt> = [];

    switch (input.audioType) {
        case AType.Audio: 
            let arr = cx.fromRealArray([...input.buffer])

            cxBuffer = fastFourierTransform(
                arr, 
                input.buffer.length, 
            );
            break;
        default: 
            return [];
    }

    let reBuffer = cxBuffer.slice(1, 4096/2).map(v => cx.mod(v));

    let max = 0;
    for (let k = 0; k < 4096; ++k) {
        if (reBuffer[k] > max) {
            max = reBuffer[k];
        }
    }

    if (max != 0) {
        // Ensure magnitudes of frequencies are normalised.
        return reBuffer.map(v => v/max);
    }

    return reBuffer;
}

const updateAudioData = (
    audioData: AData
) => {
    audioData.inputs[0].frequencyBuffer = 
        generateFrequencyBufferFromInput(audioData.inputs[0]);
}

const updateSystemAudioData = (
    audioData: AData,
    sysAudioBuffer: Array<number>
) => {
    audioData.inputs[0].buffer = sysAudioBuffer;
}

export { 
    type AData,

    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData,
};

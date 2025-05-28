import { CMath as cx } from "./math/complex";

enum AType {
    MIDI = 0,
    Audio,
};

interface AInput {
    buffer: Buffer<Uint8Array> | null;
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

    let cxBuffer: Array<cx.CInt>;

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

    return cxBuffer
        .map((value: cx.CInt, _index: number) => {
            return cx.mod(value);
        });
}

const getMagnitudeAtHz = (
    input: AInput, hz: number
): number => {
    if (input.buffer == null) {
        return 0
    }

    let hzPerBin = input.sampleRate / input.buffer.length;
    let i = Math.floor(hz / hzPerBin)

    if (i < input.frequencyBuffer.length && i >= 0) {
        return input.frequencyBuffer[i] 
    }

    return 0
}

const updateAudioData = (
    audioData: AData
) => {
    audioData.inputs[0].frequencyBuffer = 
        generateFrequencyBufferFromInput(audioData.inputs[0]);
}

const updateSystemAudioData = (
    audioData: AData,
    sysAudioBuffer: Buffer<Uint8Array>
) => {
    audioData.inputs[0].buffer = sysAudioBuffer;
}

export { 
    AData, 
    initialiseAudioData, 
    updateAudioData, 
    updateSystemAudioData,
    getMagnitudeAtHz,
};

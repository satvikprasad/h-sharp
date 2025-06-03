// TODO: Don't hardcode length of input buffer.

import { DoubleStack, DoubleStackNode } from "./structures/double-stack";
import { float32MemoryViewFromWASM, TAudioRealFFT, WASMData } from "./wasm";

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

    logScaleBase: number;
    logScaleAmplitude: number;

    sampleRate: number,
    audioType: AType;
};

interface AData {
    inputs: AInput[],

    inputFFTBuffer: Float32Array,
    inputPtr: number,

    outputFFTBuffer: Float32Array,
    outputPtr: number,

    realFFT: TAudioRealFFT,
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

const initialiseAudioData = (
    wasmData: WASMData 
): AData => {
    // TODO: Check if this is correctly hardcoded.
    const bufferPtr = wasmData.audio.initialiseBuffers(512); 

    const inputFFTBuffer = float32MemoryViewFromWASM(
        wasmData.memory,
        bufferPtr,
        512
    ); // TODO: Check if this length is correct
    const inputPtr = bufferPtr;

    const outputFFTBuffer = float32MemoryViewFromWASM(
        wasmData.memory,
        bufferPtr + Float32Array.BYTES_PER_ELEMENT*512,
        512
    );
    const outputPtr = bufferPtr + Float32Array.
        BYTES_PER_ELEMENT*512;

    // TODO: Fix this hardcoding
    let systemAudioInput: AInput = {
        sampleRate: 44100,
        raw: initWaveformData(4),
        logScaleBase: 0.019,
        logScaleAmplitude: wasmData.audio.computeLogScaleAmplitude(
            512, 0.019
        ),
        frequencySpectrum: initWaveformData(512),
        audioType: AType.Audio,
    }

    // Guarantees first element is system audio
    return {
        inputs: [systemAudioInput],

        inputFFTBuffer,
        inputPtr,

        outputFFTBuffer,
        outputPtr,

        realFFT: wasmData.audio!.realFFT,
    };
}

const updateFrequencySpectrumForInput = (
    audioData: AData,
    input: AInput
) => {
    // Update buffer
    if (input.raw.buffer == null) {
        return 
    }

    let reBuffer = new Float32Array(256);

    switch (input.audioType) {
        case AType.Audio: 
            audioData.inputFFTBuffer.set(input.raw.buffer);

            audioData.realFFT(
                audioData.inputPtr, audioData.outputPtr, 
                512,
                input.logScaleAmplitude,
                input.logScaleBase
            );

            reBuffer.set(audioData.outputFFTBuffer.slice(0, 256));

            break;
        default: 
            return
    }

    input.frequencySpectrum.buffer = reBuffer;

    // Update maximums
    updateMaximums(input.frequencySpectrum);
    updateMaximums(input.raw);
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
    audioData: AData,
    input: AInput
) => {
    updateFrequencySpectrumForInput(audioData, input);
}

const updateAudioData = (
    audioData: AData
) => {
    for (let k = 0; k < audioData.inputs.length; ++k) {
        updateInput(audioData, audioData.inputs[k]);
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

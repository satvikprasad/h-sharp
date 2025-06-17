// TODO: Port to WASM
class AudioProcessor extends AudioWorkletProcessor {
    private currentChunk: Float32Array = new Float32Array(512);
    private currentChunkLength = 0;

    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ) {
        if (inputs[0][0].length != 128) {
            throw Error("Input buffer length was not 128.");
        }

        if (this.currentChunkLength < 512) {
            this.currentChunk.set(inputs[0][0], this.currentChunkLength);

            this.currentChunkLength += 128;
        } else {
            if (this.currentChunk.length != 512) {
                throw Error("Length must always be a multiple of 128.");
            }

            const copy = new Float32Array(this.currentChunk);

            this.port.postMessage(copy, {
                transfer: [copy.buffer],
            });

            this.currentChunk.set(inputs[0][0]);
            this.currentChunkLength = 128;
        }

        return true;
    }
}

registerProcessor("audio-processor", AudioProcessor);

export interface IElectronAPI {
    getSize: () => Promise<[Number, Number]>,
    getAudioBuffer: () => Promise<Buffer<Uint8Array>>,
}

declare global {
    interface Window {
        electronAPI: IElectronAPI
    }
}

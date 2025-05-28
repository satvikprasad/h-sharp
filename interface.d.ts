type OnSystemAudioUpdateCallback = (buffer: Buffer<Uint8Array>) => void;

export interface IElectronAPI {
    getSize: () => Promise<[Number, Number]>,
    onSystemAudioUpdate: (callback: OnSystemAudioUpdateCallback) => Promise<void>,
}

declare global {
    interface Window {
        electronAPI: IElectronAPI
    }
}

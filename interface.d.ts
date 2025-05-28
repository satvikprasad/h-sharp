type OnSystemAudioUpdateCallback = (buffer: Buffer<Uint8Array>) => void;

export interface IElectronAPI {
    getSize: () => Promise<[Number, Number]>,

    onSystemAudioUpdate: (
        callback: OnSystemAudioUpdateCallback
    ) => Promise<void>,

    fs: IFileSystemAPI,
}

export interface IFileSystemAPI {
    readFileRelPath: (
        path: string[]
    ) => Promise<string>,
}

declare global {
    interface Window {
        electronAPI: IElectronAPI,
    }
}

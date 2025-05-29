type AudioOnListenerCallback = (buffer: Buffer<Uint8Array>) => void;

type FrameOnResizedCallback = (dim: {
    width: number,
    height: number
}) => void;

export interface IElectronAPI {
    audio: {
        onListener: (
            callback: AudioOnListenerCallback
        ) => Promise<void>,
    }

    frame: {
        getSize: () => Promise<[Number, Number]>,

        onResized: (
            callback: FrameOnResizedCallback
        ) => Promise<void>
    }

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

type AudioOnListenerCallback = (buffer: Float32Array) => void;

type FrameOnResizedCallback = (dim: {
    width: number,
    height: number
}) => void;

export interface ILocalAPI {
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

    readFileSync: (
        path: string, options?: Object
    ) => Promise<string | Uint8Array>,
}

declare global {
    interface Window {
        local: ILocalAPI,
    }
}

import * as fs from "fs"

type OnSystemAudioUpdateCallback = (buffer: Buffer<Uint8Array>) => void;

export interface IElectronAPI {
    getSize: () => Promise<[Number, Number]>,

    onSystemAudioUpdate: (
        callback: OnSystemAudioUpdateCallback
    ) => Promise<void>,

    path: IPathAPI,
    fs: IFileSystemAPI,
}

export interface IPathAPI {
    join: (paths: string[]) => Promise<string>,
    dirname: (p: string[]) => Promise<string>,
}

export interface IFileSystemAPI {
    readFileSync: (
        path: fs.PathOrFileDescriptor, options?
    ) => Promise<NonSharedBuffer | string>,

    getWorkingDir: () => Promise<string>,
}

declare global {
    interface Window {
        electronAPI: IElectronAPI,
    }
}

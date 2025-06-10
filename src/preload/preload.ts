import type { FrameOnResizedCallback, AudioOnListenerCallback } from "../../interface";

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('local', {
    audio: {
        onListener: (
            callback: AudioOnListenerCallback
        ) => ipcRenderer.on(
            'audio.on-listener',
            (_event, value: Float32Array) => callback(value)
        ),
    },

    frame: {
        getSize: () => ipcRenderer.invoke('get-win-size'),

        onResized: (callback: FrameOnResizedCallback) => ipcRenderer.on(
            'frame.resized',
            (_event, value: {
                width: number,
                height: number
            }) => callback(value)
        )
    },

    fs: {
        readFileRelPath: (
            path: string[]
        ) => ipcRenderer.invoke('fs.readFileRelPath', ...path),

        readFileSync: (
            path: string | Buffer | URL | number,
            options?: Object,
        ) => ipcRenderer.invoke(
            'fs.readFileSync', path, options
        ),
    }
});

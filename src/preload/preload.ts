import { OnSystemAudioUpdateCallback } from "../../interface";

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSize: () => ipcRenderer.invoke('get-win-size'),

    onSystemAudioUpdate: (
        callback: OnSystemAudioUpdateCallback
    ) => ipcRenderer.on(
        'audio.system-audio-update',
        (_event, value: Buffer<Uint8Array>) => callback(value)
    ),

    path: {
        join: (paths: string[]) => ipcRenderer.invoke("path.join", ...paths),
        dirname: (path: string) => ipcRenderer.invoke("path.dirname", path),
    },

    fs: {
        readFileSync: (
            path, 
            options? 
        ) => ipcRenderer.invoke("fs.readFileSync", path, options),

        getWorkingDir: () => ipcRenderer.invoke("fs.getWorkingDir"),
    }
});

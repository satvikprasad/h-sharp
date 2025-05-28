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
});

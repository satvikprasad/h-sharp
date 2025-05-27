const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSize: () => ipcRenderer.invoke('get-win-size'),
    getAudioBuffer: () => ipcRenderer.invoke('get-audio-buffer')
});

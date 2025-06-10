const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    audio: {
        onListener: (callback) => ipcRenderer.on('audio.on-listener', (_event, value) => callback(value)),
    },
    frame: {
        getSize: () => ipcRenderer.invoke('get-win-size'),
        onResized: (callback) => ipcRenderer.on('frame.resized', (_event, value) => callback(value))
    },
    fs: {
        readFileRelPath: (path) => ipcRenderer.invoke('fs.readFileRelPath', ...path),
        readFileSync: (path, options) => ipcRenderer.invoke('fs.readFileSync', path, options),
    }
});
export {};

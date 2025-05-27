// NOTE: Naming conventions follow js standards,
// PascalCase are instantiable constructors, whereas
// camelCase are non-instantiable.
const { app, BrowserWindow, ipcMain, session, desktopCapturer } = require('electron');
const { spawn } = require('child_process')
const path = require('node:path');

let currentChunk: Buffer<Uint8Array> = null;

const systemAudioCapturer = spawn(path.join(__dirname, '../bin/listener'));
systemAudioCapturer.stdout.on('data', (chunk: Buffer<Uint8Array>) => {
    currentChunk = chunk
})

function getSize(win: any): [Number, Number] {
    return win.getSize();
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
		webPreferences: {
			preload: path.join(__dirname, '/../preload/preload.js'),
		},
    });

    win.loadFile(path.join(__dirname, '/../index.html'));
}

app.whenReady().then(() => {
    createWindow();

    // Create new window on macOS platforms if no windows are present.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    // Get window size
    ipcMain.handle('get-win-size', (event) => {
        const webContents = event.sender;
        const win = BrowserWindow.fromWebContents(webContents);
        return getSize(win);
    });

    ipcMain.handle('get-audio-buffer', (event) => {
        return currentChunk;
    })
});

app.on('window-all-closed', () => {
    // Close application if all windows are closed and the
    // user is on Windows or Linux
    if (process.platform != 'darwin') app.quit(); 
});

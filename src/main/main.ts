// NOTE: Naming conventions follow js standards,
// PascalCase are instantiable constructors, whereas

import { cwd } from "process";

// camelCase are non-instantiable.
const { app, BrowserWindow, ipcMain, session, desktopCapturer } = require('electron');
const { spawn } = require('child_process')
const path = require('node:path');
const fs = require('fs');

// Enable hot reloading in development
try {
    require('electron-reloader')(module, {
        debug: true,
        watchRenderer: true
    });
} catch (_) { console.log('Error'); }

// TODO: make this better
let hasWindow = false;

function getSize(win: any): [Number, Number] {
    return win.getSize();
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
        },
    });

    hasWindow = true;

    win.loadFile(path.join(__dirname, '../index.html'));

    return win
}

app.whenReady().then(() => {
    let win = createWindow();

    // Begin system audio capture
    const systemAudioCapturer = spawn(path.join(__dirname, '../bin/listener'));

    systemAudioCapturer.stdout.on('data', (chunk: Buffer<Uint8Array>) => {
        if (hasWindow) {
            let buf = new ArrayBuffer(chunk.length)
            let f = new Float32Array(buf)
            new Uint8Array(buf).set([...chunk])

            win.webContents.send('audio.on-listener', f);
        }
    });

    win.on('will-resize', (_event, newBounds: any, _details) => {
        win.webContents.send('frame.resized', { 
            width: newBounds.width, 
            height: newBounds.height 
        });
    })

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

    ipcMain.handle('fs.readFileRelPath', (_event, ...args: any) => {
        let p = path.join(__dirname, "../", ...args);
        let buf = fs.readFileSync(p, { encoding: "utf8" });        

        if (typeof(buf) == "string") {
            return buf;
        }

        throw Error(`Incorrect encoding while reading ${p}`);
    });

    ipcMain.handle('fs.readFileSync', (_event, ...args: any) => {
        console.log(`Using working directory ${cwd()}`);

        let p = path.join(__dirname, "../", args[0]);
        let options = args[1];

        if (options) {
            return fs.readFileSync(p, options);
        } 

        return new Uint8Array(fs.readFileSync(p));
    });
});

app.on('window-all-closed', () => {
    // Close application if all windows are closed and the
    // user is on Windows or Linux
    app.quit(); 
    hasWindow = false;
});

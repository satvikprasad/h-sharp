// NOTE: Naming conventions follow js standards,
// PascalCase are instantiable constructors, whereas

import { cwd } from "process";

// camelCase are non-instantiable.
const { app, BrowserWindow, ipcMain, session, desktopCapturer } = require('electron');
const { spawn } = require('child_process')
const path = require('node:path');
const fs = require('fs');

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

    win.loadFile(path.join(__dirname, '../../dist/index.html'));

    return win
}

app.whenReady().then(() => {
    let win = createWindow();

    // Begin system audio capture
    const systemAudioCapturer = spawn(path.join(__dirname, '../../bin/peggiator-listener'));

    systemAudioCapturer.stdout.on('data', (chunk: Buffer<Uint8Array>) => {
        if (hasWindow) {
            if (chunk.length < 2048) {
                throw Error("systemAudioCapturer: chunk length was incorrect size");
            }

            // TODO: Don't hardcode this.
            let buf = new ArrayBuffer(Math.min(chunk.length, 2048));
            let f = new Float32Array(buf);
            new Uint8Array(buf).set([...chunk].slice(0, 2048));

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

    // TODO: Streamline this stuff
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

        if (args[0].startsWith("file:")) {
            const url: string = args[0];
            const path = url.slice(7);

            return fs.readFileSync(path);
        }

        let p = path.join(__dirname, "../../dist/", args[0]);
        let options = args[1];

        if (options) {
            return fs.readFileSync(p, options);
        } 

        return new Uint8Array(fs.readFileSync(p));
    });

    ipcMain.handle('fs.readFileFromURL', (_event, ...args: any) => {
        const url: string = args[0];

        if (url.startsWith("data:")) {
            // We have a data URL
            const data = url.split(',')[1];
            const bytes = Buffer.from(data, "base64");

            return bytes.toString();
        }

        return fs.readFileSync(url);
    });
});

app.on('window-all-closed', () => {
    // Close application if all windows are closed and the
    // user is on Windows or Linux
    app.quit(); 
    hasWindow = false;
});

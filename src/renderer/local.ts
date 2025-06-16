import { AudioOnListenerCallback, FrameOnResizedCallback, ILocalAPI } from "../../interface";

import path from 'path-browserify';

const initialiseLocalSystem = (): ILocalAPI => {
    return {
        frame: {
            async getSize () {
                return [window.innerWidth, window.innerHeight];
            },
            async onResized (
                callback: FrameOnResizedCallback
            ) {}
        },
        audio: {
            async onListener (
                callback: AudioOnListenerCallback
            ) {}
        },
        fs: {
            async readFileRelPath(paths): Promise<string> {
                let res = await fetch(path.join(...paths));

                return res.text(); 
            },

            async readFileFromURL(url: string): Promise<string> {
                console.log(url);

                let res = await fetch(url);
                return res.text();
            },

            async readFileSync(path, options): Promise<string | Uint8Array> {
                let res = await fetch(path);

                if (options?.hasOwnProperty("encoding")) {
                    let str: string = await res.text();
                    return str;
                }

                return await res.bytes();
            },
        },
    };
}

export { initialiseLocalSystem };

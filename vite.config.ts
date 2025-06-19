import type { UserConfig } from 'vite';

import path from 'path';

import react from '@vitejs/plugin-react';

export default {
    plugins: [react()],
    resolve: {
        alias: {
            "@styles": path.resolve(__dirname, "./assets/styles"),
        }
    }
} satisfies UserConfig;
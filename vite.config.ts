import type { UserConfig } from "vite";

import monacoEditorPlugin from "vite-plugin-monaco-editor";

import path from "path";

import react from "@vitejs/plugin-react";

export default {
    plugins: [react(), monacoEditorPlugin({
        languageWorkers: ['typescript', 'editorWorkerService']
    })],
    resolve: {
        alias: {
            "@styles": path.resolve(__dirname, "./assets/styles"),
        },
    },
} satisfies UserConfig;

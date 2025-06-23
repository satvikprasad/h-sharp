import * as monaco from "monaco-editor";
import * as ts from "typescript";

interface EditorData {
    editor: monaco.editor.IStandaloneCodeEditor;
    container: HTMLElement;
}

const value = `function generateColors(fidelity: number): Float32Array {
    let colors: number[] = [];

    for (let k = 0; k <= fidelity; ++k) {
        let t = k/fidelity;
        colors.push(1.0, 1.0, t, 1.0);
        colors.push(1.0, 1.0, t, 1.0);
    }

    return new Float32Array(colors):
}`;

function initialiseEditor(): EditorData {
    const editorContainer = document.getElementById("editor-container");

    if (editorContainer == null) {
        throw Error("Could not find container for monaco editor.");
    }

    const editor = monaco.editor.create(editorContainer, {
        value,
        language: "typescript",
        automaticLayout: true,
        theme: "vs-dark",
    });

    return {
        editor,
        container: editorContainer,
    };
}

function toggleEditorVisible(editorData: EditorData) {
    const container = editorData.container;

    if (container.classList.contains("hidden")) {
        forceEditorVisible(editorData);
    } else {
        forceEditorHidden(editorData);
    }
}

function forceEditorVisible(editorData: EditorData) {
    const container = editorData.container;

    container.classList.remove("hidden");
}

function forceEditorHidden(editorData: EditorData) {
    const container = editorData.container;

    container.classList.add("hidden");
}

function editorInject(editorData: EditorData, value: string) {
    editorData.editor.setValue(value);
}

function editorTranspile(editorData: EditorData): string {
    return ts.transpile(editorData.editor.getValue());
}

export {
    type EditorData,

    initialiseEditor,
    toggleEditorVisible,
    forceEditorVisible,
    forceEditorHidden,

    editorInject,
    editorTranspile,
};

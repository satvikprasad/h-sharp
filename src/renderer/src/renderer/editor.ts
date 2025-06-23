import * as monaco from "monaco-editor";
import * as ts from "typescript"

interface EditorData {
    editor: monaco.editor.IStandaloneCodeEditor;
};

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
        editor
    };
}

function editorPrint(editorData: EditorData) {
    const editor = editorData.editor;

    const code = `
        ${ts.transpile(editor.getValue())}

        console.log(generateColors(1000));
    `;

    eval(code);

    console.log(code);
}

export { initialiseEditor, editorPrint };

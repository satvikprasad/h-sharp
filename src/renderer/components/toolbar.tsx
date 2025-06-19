import React from "react";
import ReactDOM from "react-dom/client"
import { initialiseInputList, InputList, InputListData, updateInputListDecibels, updateInputListSelectedItem } from "./input-list";

import * as audio from "../audio"
import { vec3 } from "gl-matrix";

interface ToolbarData {
    inputListData: InputListData;
};

function initialiseToolbar(inputListParameters: {
    audioData: audio.AudioData,
    waveformPositions: vec3[]
}): ToolbarData {
    let toolbar = document.getElementById("toolbar");

    if (!toolbar) {
        throw Error("Could not find toolbar in DOM.");
    }

    const root = ReactDOM.createRoot(toolbar);

    const [inputListData, inputListFragment] = initialiseInputList(
        inputListParameters.audioData,
        inputListParameters.waveformPositions
    );

    root.render(
        <div>
            { inputListFragment }
        </div>
    );

    return {
        inputListData
    };
}

function updateToolbar(
    toolbarData: ToolbarData,
    inputListUpdateParameters: {
        audioData: audio.AudioData;
        decibels: number[];
        selectedWaveformIndex: number;
    }
) {
    updateInputListSelectedItem(
        toolbarData.inputListData,
        inputListUpdateParameters.audioData.inputs,
        inputListUpdateParameters.audioData.waveforms,
        inputListUpdateParameters.selectedWaveformIndex
    );

    updateInputListDecibels(
        toolbarData.inputListData,
        inputListUpdateParameters.decibels
    );
}

export { type ToolbarData, initialiseToolbar, updateToolbar };

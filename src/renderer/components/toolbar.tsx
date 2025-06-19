import React from "react";
import ReactDOM from "react-dom/client";
import {
    initialiseInputList,
    InputList,
    InputListData,
    updateInputListDecibels,
    updateInputListSelectedItem,
} from "./input-list";

import "@styles/toolbar.css";

import * as audio from "../audio";
import { vec3 } from "gl-matrix";
import { ControlListData, initialiseControlList } from "./control-list";

interface ToolbarData {
    inputListData: InputListData;
    controlListData: ControlListData;
}

function initialiseToolbar(
    inputListParameters: {
        audioData: audio.AudioData;
        waveformPositions: vec3[];
    },
    controlListParameters: {
        centerViewportHandler: () => void;
        centerObjectsHandler: () => void;
    }
): ToolbarData {
    let toolbar = document.getElementById("toolbar");

    if (!toolbar) {
        throw Error("Could not find toolbar in DOM.");
    }

    const root = ReactDOM.createRoot(toolbar);

    const [inputListData, inputListFragment] = initialiseInputList(
        inputListParameters.audioData,
        inputListParameters.waveformPositions
    );

    const [controlListData, controlListFragment] = initialiseControlList(
        controlListParameters.centerViewportHandler,
        controlListParameters.centerObjectsHandler
    );

    root.render(
        <div>
            {inputListFragment}
            {controlListFragment}
        </div>
    );

    return {
        inputListData,
        controlListData,
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

import { vec3 } from "gl-matrix";
import * as audio from "../audio";
import React, { useReducer, useState } from "react";
import { DecibelMeter } from "./decibel-meter";

import "@styles/input-list.css";

interface InputItemProps {
    input: audio.Input;
    decibelValue: number;
    selected: boolean;
    selectedWaveformType: audio.WaveformType | -1;
}

interface InputListProps {
    inputListData: InputListData;
    audioData: audio.AudioData;
    waveformPositions: vec3[];
}

function InputItem({
    input,
    decibelValue,
    selected,
    selectedWaveformType,
}: InputItemProps): React.JSX.Element {
    const [isPlaying, setIsPlaying] = useState<boolean>(
        input.isPlaying == undefined ? true : input.isPlaying
    );

    return (
        <li className="toolbar-subitem">
            <div className="pane">
                <span className="input-name">{input.name}</span>
                {input.inputType == audio.InputType.Audio ? (
                    <button
                        className="play-pause-btn"
                        onClick={(_) => {
                            audio.inputTogglePlaying(input);

                            if (input.isPlaying == undefined) {
                                throw Error(
                                    "input.isPlaying must be defined for audio inputs."
                                );
                            }

                            setIsPlaying(input.isPlaying);
                        }}
                    >
                        <span className="icon">
                            {isPlaying ? <>⏸</> : <>▶</>}
                        </span>
                    </button>
                ) : (
                    <></>
                )}
            </div>
            <DecibelMeter value={decibelValue} />
            <ul className="toolbar-sublist">
                <li
                    className={
                        selected &&
                        selectedWaveformType == audio.WaveformType.Raw
                            ? "selected"
                            : ""
                    }
                    key={audio.WaveformType.Raw}
                >
                    Raw Waveform
                </li>
                <li
                    className={
                        selected &&
                        selectedWaveformType == audio.WaveformType.Frequency
                            ? "selected"
                            : ""
                    }
                    key={audio.WaveformType.Frequency}
                >
                    Frequency Waveform
                </li>
            </ul>
        </li>
    );
}

function InputList({
    inputListData,
    audioData,
    waveformPositions,
}: InputListProps): [() => React.JSX.Element, () => React.JSX.Element] {
    return [
        (): React.JSX.Element => {
            const [, forceUpdate] = useReducer((x) => x + 1, 0);

            function addInput() {
                let input = document.getElementById("hidden-input");

                if (input == null) {
                    throw Error("No input element found.");
                }

                input.onclick = async(e) => {
                    console.log("clicked")
                }

                input.onsubmit = async(e) => {
                    console.log("sdkf");
                }

                input.onchange = async (e) => {
                    let target: HTMLInputElement | null =
                        e.target as HTMLInputElement;

                    if (!target) {
                        throw Error(
                            "Could not cast target to HTMLInputElement."
                        );
                    }

                    if (!target.files) {
                        throw Error("Did not read any files.");
                    }

                    const src = URL.createObjectURL(target.files[0]);
                    console.log(src);

                    const newInput = await audio.addInput(
                        audioData,
                        `File: ${target.files[0].name}`,
                        audio.InputType.Audio,
                        src
                    );

                    waveformPositions[newInput.rawWaveformIndex] = [
                        2 * (audioData.waveforms.length - 2),
                        0,
                        0.0,
                    ];

                    waveformPositions[newInput.frequencyWaveformIndex] = [
                        2 * (audioData.waveforms.length - 1),
                        0,
                        0.0,
                    ];

                    forceUpdate();
                };

                input.click();
            }

            return (
                <>
                    <h2>Audio Inputs</h2>
                    <button className="add-input" onClick={addInput}>
                        +
                    </button>
                    <input
                        type="file"
                        accept="audio/*"
                        id="hidden-input"
                    />
                </>
            );
        },
        () => {
            const [selectedInputIndex, setSelectedInputIndex] =
                useState<number>(-1);
            const [selectedWaveformType, setSelectedWaveformType] = useState<
                audio.WaveformType | -1
            >(-1);

            const [decibels, setDecibels] = useState<number[]>([]);

            inputListData.setSelectedWaveformType = setSelectedWaveformType;
            inputListData.setSelectedInputIndex = setSelectedInputIndex;
            inputListData.setDecibels = setDecibels;

            return (
                <>
                    {audioData.inputs.map((input, i) => {
                        // TODO: Make this key unique.
                        return (
                            <InputItem
                                key={i}
                                input={input}
                                decibelValue={decibels[i]}
                                selected={selectedInputIndex == i}
                                selectedWaveformType={selectedWaveformType}
                            />
                        );
                    })}
                </>
            );
        },
    ];
}

interface InputListData {
    setSelectedInputIndex: React.Dispatch<React.SetStateAction<number>> | null;
    setSelectedWaveformType: React.Dispatch<
        React.SetStateAction<audio.WaveformType | -1>
    > | null;
    setDecibels: React.Dispatch<React.SetStateAction<number[]>> | null;
}

function initialiseInputList(
    audioData: audio.AudioData,
    waveformPositions: vec3[]
): [InputListData, [() => React.JSX.Element, () => React.JSX.Element]] {
    // Mutated by InputList to expose setters for the following.
    const inputListData: InputListData = {
        setSelectedInputIndex: null,
        setSelectedWaveformType: null,
        setDecibels: null,
    };

    return [
        inputListData,
        InputList({ inputListData, audioData, waveformPositions }),
    ];
}

function updateInputListSelectedItem(
    inputListData: InputListData,
    inputs: audio.Input[],
    waveforms: audio.WaveformData[],
    selectedWaveformIndex: number
) {
    if (!inputListData.setSelectedInputIndex) {
        console.log("WARNING: selectedInputIndex setter was null");
        return;
    }

    if (!inputListData.setSelectedWaveformType) {
        console.log("WARNING: selectedWaveformType setter was null");
        return;
    }

    if (selectedWaveformIndex == -1) {
        inputListData.setSelectedInputIndex(-1);
        inputListData.setSelectedWaveformType(-1);
        return;
    }

    const selectedInputIndex = waveforms[selectedWaveformIndex].inputIndex;
    const selectedInput = inputs[selectedInputIndex];

    let selectedWaveformType: audio.WaveformType | -1 = -1;
    if (selectedInput.rawWaveformIndex == selectedWaveformIndex) {
        selectedWaveformType = audio.WaveformType.Raw;
    } else if (selectedInput.frequencyWaveformIndex == selectedWaveformIndex) {
        selectedWaveformType = audio.WaveformType.Frequency;
    }

    inputListData.setSelectedInputIndex(selectedInputIndex);
    inputListData.setSelectedWaveformType(selectedWaveformType);
}

function updateInputListDecibels(
    inputListData: InputListData,
    decibels: number[]
) {
    if (!inputListData.setDecibels) {
        console.log("WARNING: decibels setter was null.");
        return;
    }

    inputListData.setDecibels(
        decibels.map((v) => {
            return v;
        })
    );
}

export {
    type InputListData,
    initialiseInputList,
    updateInputListSelectedItem,
    updateInputListDecibels,
    InputList,
};

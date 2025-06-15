import { vec3 } from "gl-matrix";
import * as audio from "./audio";
import { HSData } from "./h-sharp";

interface InputListData {
    inputListElement: HTMLUListElement;
};

function createInputItem(input: audio.Input): HTMLLIElement {
    let inputItem = document.createElement("li");
    inputItem.className = "input-item";

    let waveformList = document.createElement("ul");
    waveformList.classList.add("waveform-list");
    {
        const raw = document.createElement("li");
        raw.innerText = "Raw Waveform";

        const freq = document.createElement("li");
        freq.innerText = "Frequency Waveform";

        waveformList.append(raw, freq);
    }

    let paneDiv = document.createElement("div");
    paneDiv.classList.add("pane");

    let inputItemText = document.createElement("span");
    inputItemText.className = "input-name";
    inputItemText.innerText = input.name;

    let inputItemPlayButton = document.createElement("button");
    inputItemPlayButton.className = "play-pause-btn";

    switch (input.inputType) {
        case audio.InputType.Audio:
            let inputItemPlayButtonIcon = document.createElement("span");
            inputItemPlayButtonIcon.className = "icon";
            inputItemPlayButtonIcon.innerText = "⏸";

            inputItemPlayButton.onclick = (_) => {
                if (input.togglePlayPause) {
                    if (input.togglePlayPause()) {
                        inputItemPlayButtonIcon.innerText = "⏸";
                        return;
                    };

                    inputItemPlayButtonIcon.innerText = "▶";
                }
            };

            inputItemPlayButton.append(inputItemPlayButtonIcon);
            break;

        case audio.InputType.SystemAudio: 
            inputItemPlayButton.append(document.createElement("span"));
        default:
            break;
    }

    paneDiv.append(inputItemText, inputItemPlayButton);

    inputItem.append(paneDiv, waveformList);

    return inputItem;
}

function pushInput(
    inputList: HTMLUListElement,
    input: audio.Input
) {
    let footer: HTMLElement = inputList.children[inputList.children.length - 1] as HTMLElement;
    footer.before(createInputItem(input));
}

function createItems(
    inputList: HTMLUListElement,
    inputs?: audio.Input[] 
) {
    let header: HTMLElement = inputList.children[0] as HTMLElement;

    let nodes: HTMLLIElement[] = [];

    if (inputs) {
        inputs.forEach((input: audio.Input) => {
            // Fill list.
            

            nodes.push(createInputItem(input));
        });
    }

    header.after(...nodes);
}

function addAddInputHandler(
    inputList: HTMLUListElement, 
    audioData: audio.AudioData,
    waveformPositions: vec3[]
) {
    let addInputButton = inputList.children.namedItem("add-input") as HTMLButtonElement;

    addInputButton.onclick = () => {
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = "audio/*";

        input.onchange = async (e) => {
            let target: HTMLInputElement | null = e.target as HTMLInputElement;
    
            if (!target) {
                throw Error(
                    "Could not cast target to HTMLInputElement.");
            }

            if (!target.files) {
                throw Error("Did not read any files.");
            }

            const src = URL.createObjectURL(target.files[0]);

            const newInput = await audio.addInput(
                audioData, 
                `File: ${target.files[0].name}`,
                audio.InputType.Audio,
                src,
            );

            pushInput(inputList, newInput);

            waveformPositions[newInput.rawWaveformIndex] = [
                2*(audioData.waveforms.length - 2),
                0,
                0.0
            ];

            waveformPositions[newInput.frequencyWaveformIndex] = [
                2*(audioData.waveforms.length - 1),
                0,
                0.0,
            ];
        };

        input.click();
    };
}

function initialiseInputList(
    audioData: audio.AudioData, 
    waveformPositions: vec3[],
): InputListData {
    let inputList: HTMLUListElement | null = document.querySelector("#input-list");

    if (!inputList) {
        throw Error("Could not find list of inputs in DOM.");
    }

    createItems(inputList, audioData.inputs);
    addAddInputHandler(inputList, audioData, waveformPositions);

    return {
        inputListElement: inputList,
    };
}

function updateInputListSelectedItem(
    inputListData: InputListData,
    selectedInputIndex: number,
    selectedWaveformType?: audio.WaveformType,
) {
    for (let i = 1; i < inputListData.inputListElement.children.length - 1; ++i) {
        const inputItem = inputListData.inputListElement.children[i];
        const waveformList = inputItem.children[1];

        for (let i = 0; i < waveformList.children.length; ++i) {
            waveformList.children[i].className = "";
        }
    }

    if (selectedInputIndex != -1) {
        if (selectedWaveformType == undefined) {
            throw Error("selectedWaveformType is required if selectedInputIndex != -1");
        }

        const selectedInput = inputListData.inputListElement.children[selectedInputIndex + 1];

        const waveformList = selectedInput.children[1];

        waveformList.children[selectedWaveformType].className = "selected";
    }
}

export { 
    type InputListData,

    initialiseInputList,
    updateInputListSelectedItem,
};

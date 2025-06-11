import * as audio from "./audio";

interface InputListData {
    inputListElement: HTMLUListElement;
};

function createInputItem(input: audio.Input): HTMLLIElement {
    let inputItem = document.createElement("li");
    inputItem.className = "input-item";

    let inputItemText = document.createElement("span");
    inputItemText.className = "input-name";
    inputItemText.innerText = input.name;

    let inputItemPlayButton = document.createElement("button");
    inputItemPlayButton.className = "play-pause-btn";

    let inputItemPlayButtonIcon = document.createElement("span");
    inputItemPlayButtonIcon.className = "icon";
    inputItemPlayButtonIcon.innerText = "⏸";

    inputItemPlayButton.onclick = (e) => {
        if (input.togglePlayPause) {
            if (input.togglePlayPause()) {
                inputItemPlayButtonIcon.innerText = "⏸";
                return;
            };

            inputItemPlayButtonIcon.innerText = "▶";
        }
    };

    switch (input.inputType) {
        case audio.InputType.Audio:
            inputItemPlayButton.append(inputItemPlayButtonIcon);
            break;

        case audio.InputType.SystemAudio: 
        default:
            break;
    }

    inputItem.append(inputItemText, inputItemPlayButton);

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
    audioData: audio.AudioData
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

            pushInput(inputList, await audio.addInput(
                audioData, 
                `File: ${target.files[0].name}`,
                audio.InputType.Audio,
                src,
            ));
        };

        input.click();
    };
}

function initialiseInputList(audioData: audio.AudioData): InputListData {
    let inputList: HTMLUListElement | null = document.querySelector("#input-list");

    if (!inputList) {
        throw Error("Could not find list of inputs in DOM.");
    }

    createItems(inputList, audioData.inputs);
    addAddInputHandler(inputList, audioData);

    return {
        inputListElement: inputList,
    };
}

export { initialiseInputList };

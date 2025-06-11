import * as audio from "./audio";

interface InputListData {
    inputListElement: HTMLUListElement;
};

function pushInput(
    inputList: HTMLUListElement,
    input: audio.Input
) {
    let footer: HTMLElement = inputList.children[inputList.children.length - 1] as HTMLElement;
    let inputItem = document.createElement("li");
    inputItem.innerText = input.name;

    footer.before(inputItem);
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
            let inputItem = document.createElement("li");
            inputItem.innerText = input.name;

            nodes.push(inputItem);
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

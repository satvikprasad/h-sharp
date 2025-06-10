import * as audio from "./audio";

interface InputListData {
    inputListElement: HTMLUListElement;
};

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

function addAddInputHandler(inputList: HTMLUListElement) {
    let addInputButton = inputList.children.namedItem("add-input") as HTMLButtonElement;

    addInputButton.onclick = () => {
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = "audio/*";

        input.onchange = (e) => {
            let target: HTMLInputElement | null = e.target as HTMLInputElement;
    
            if (!target) {
                throw Error("Could not cast target to HTMLInputElement.");
            }

            if (!target.files) {
                throw Error("Did not read any files.");
            }

            let file = target.files[0];
        };

        input.click();
    };
}

function initialiseInputList(inputs?: audio.Input[]): InputListData {
    let inputList: HTMLUListElement | null = document.querySelector("#input-list");

    if (!inputList) {
        throw Error("Could not find list of inputs in DOM.");
    }

    createItems(inputList, inputs);
    addAddInputHandler(inputList);

    return {
        inputListElement: inputList,
    };
}

export { initialiseInputList };

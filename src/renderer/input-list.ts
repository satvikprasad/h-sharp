interface InputListData {
    inputListElement: HTMLUListElement;
};

function initialiseInputList(inputs?: string[]): InputListData {
    let inputList: HTMLUListElement | null = document.querySelector("#input-list");

    if (!inputList) {
        throw Error("Could not find list of inputs in DOM.");
    }

    if (inputs) {
        inputs.forEach((input: string) => {
            // Fill list.
            let inputItem = document.createElement("li");
            inputItem.innerText = input;

            inputList.appendChild(inputItem);
        });
    }

    return {
        inputListElement: inputList,
    };
}

export { initialiseInputList };

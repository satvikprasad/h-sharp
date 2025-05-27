const main = async () => {
    const canvas: HTMLCanvasElement = document.querySelector("#gl-canvas");

    let size: [Number, Number] = await window.electronAPI.getSize();

    canvas.setAttribute("width", String(size[0]));
    canvas.setAttribute("height", String(size[1]));
};

main();

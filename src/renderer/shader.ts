import { type IFileSystemAPI } from "../../interface";

// Stores a shader program and it's
// attrib and uniform locations
const initShaderProgram = async (
    gl: WebGLRenderingContext,
    vsRelPath: string,
    fsRelPath: string,
    fs: IFileSystemAPI,
): Promise<WebGLProgram | null> => {
    let vsSource = await fs.readFileRelPath(
        ["shaders/source", vsRelPath]
    );

    let fsSource = await fs.readFileRelPath(
        ["shaders/source", fsRelPath]
    );

    const vertexShader = loadShader(
        gl, 
        gl.VERTEX_SHADER, 
        vsSource
    );

    if (vertexShader == null) {
        throw Error(`Could not load vertex shader ${vsRelPath}`);
    }

    const fragShader = loadShader(
        gl, 
        gl.FRAGMENT_SHADER, 
        fsSource
    );

    if (fragShader == null) {
        throw Error(`Could not load vertex shader ${vsRelPath}`);
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragShader);

    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        // Program link was unsuccesful.
        alert(
            `Unable to initialise the shader program:\
            ${gl.getProgramInfoLog(shaderProgram)}`
        );

        gl.deleteProgram(shaderProgram);

        return null;
    }


    return shaderProgram;
}

const loadShader = (
    gl: WebGLRenderingContext,
    shadType: GLenum,
    source: string
): WebGLShader | null => {
    const shader = gl.createShader(shadType);

    if (shader == null) {
        throw Error(
            `gl.createShader(${shadType}) returned null`
        );
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // Shader compile was unsuccesful.
        alert(
            `An error occured while compiling the shaders:\
            ${gl.getShaderInfoLog(shader)}`
        );

        gl.deleteShader(shader);

        return null;
    }

    return shader;
}

export { initShaderProgram };

import { IFileSystemAPI } from "../../interface";

// Stores a shader program and it's
// attrib and uniform locations
interface ProgramInfo {
    program: WebGLProgram;

    attribLocations: {
        vertexPosition: GLint;
        vertexColor: GLint;
    };

    uniformLocations: {
        projMat: WebGLUniformLocation;
        mvMat: WebGLUniformLocation;
    }
};

const initShaderProgram = async (
    gl: WebGLRenderingContext,
    vsRelPath: string,
    fsRelPath: string,
    fs: IFileSystemAPI,
): Promise<WebGLProgram> => {
    let vsSource = await fs.readFileRelPath(["shaders", vsRelPath]);
    let fsSource = await fs.readFileRelPath(["shaders", fsRelPath]);

    const vertexShader = loadShader(
        gl, gl.VERTEX_SHADER, vsSource);

    const fragShader = loadShader(
        gl, gl.FRAGMENT_SHADER, fsSource);

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

const getShaderProgramInfo = (
    gl: WebGLRenderingContext,
    program: WebGLProgram
): ProgramInfo => {
    const projMatLoc = gl.getUniformLocation(
        program, "uProjectionMatrix");
    const mvMatLoc = gl.getUniformLocation(
        program, "uModelViewMatrix");

    if (!projMatLoc) {
        alert(`Could not find uniform location\
            for uProjectionMatrix`);

        return null;
    }

    if (!mvMatLoc) {
        alert(`Could not find uniform location\
            for uModelViewMatrix`);

        return null;
    }

    return {
        program: program,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(
                program, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(
                program, "aVertexColor"),
        },
        uniformLocations: {
            projMat: projMatLoc,
            mvMat: mvMatLoc,
        },
    };
}

const loadShader = (
    gl: WebGLRenderingContext,
    shadType: GLenum,
    source: string
): WebGLShader => {
    const shader = gl.createShader(shadType);

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

export { ProgramInfo, initShaderProgram, getShaderProgramInfo };

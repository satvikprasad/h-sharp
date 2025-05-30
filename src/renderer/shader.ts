import { type IFileSystemAPI } from "../../interface";

// Stores a shader program and it's
// attrib and uniform locations
interface DefaultProgramInfo {
    program: WebGLProgram;

    attribLocations: {
        vertexPosition: GLint;
        vertexColor: GLint;
    };

    uniformLocations: {
        projMat: WebGLUniformLocation;
        mvMat: WebGLUniformLocation;
    };
};

interface WaveformProgramInfo {
    program: WebGLProgram;

    attribLocations: {
        vertexPosition: GLint;
        vertexColor: GLint;
        vertexValue: GLint;
    };

    uniformLocations: {
    };
};

const initShaderProgram = async (
    gl: WebGLRenderingContext,
    vsRelPath: string,
    fsRelPath: string,
    fs: IFileSystemAPI,
): Promise<WebGLProgram | null> => {
    let vsSource = await fs.readFileRelPath(["shaders", vsRelPath]);
    let fsSource = await fs.readFileRelPath(["shaders", fsRelPath]);

    const vertexShader = loadShader(
        gl, gl.VERTEX_SHADER, vsSource);

    if (vertexShader == null) {
        throw Error(`Could not load vertex shader ${vsRelPath}`);
    }

    const fragShader = loadShader(
        gl, gl.FRAGMENT_SHADER, fsSource);

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

// TODO: This is still shader-specific
const getDefaultShaderProgramInfo = (
    gl: WebGLRenderingContext,
    program: WebGLProgram
): DefaultProgramInfo => {
    const projMatLoc = gl.getUniformLocation(
        program, "uProjectionMatrix");
    const mvMatLoc = gl.getUniformLocation(
        program, "uModelViewMatrix");

    if (!projMatLoc) {
        throw Error(`Could not find uniform location\
            for uProjectionMatrix`);
    }

    if (!mvMatLoc) {
        throw Error(`Could not find uniform location\
            for uModelViewMatrix`);
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

export { 
    type DefaultProgramInfo, 

    initShaderProgram, 
    getDefaultShaderProgramInfo 
};

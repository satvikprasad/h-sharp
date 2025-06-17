import { mat4, vec3 } from "gl-matrix";

interface CameraData {
    xRot: number;
    yRot: number;

    // Represents sphere on which camera is fixed.
    radius: number;

    focus: vec3;
}

const createViewMatFromCamera = (cameraData: CameraData): mat4 => {
    let viewMatOut: mat4 = new Float32Array(16);

    mat4.fromTranslation(viewMatOut, vec3.fromValues(0, 0, -cameraData.radius));

    mat4.rotate(viewMatOut, viewMatOut, cameraData.xRot, [1, 0, 0]);

    mat4.rotate(viewMatOut, viewMatOut, cameraData.yRot, [0, 1, 0]);

    mat4.translate(
        viewMatOut,
        viewMatOut,
        vec3.scale(vec3.create(), cameraData.focus, -1)
    );

    return viewMatOut;
};

export { type CameraData, createViewMatFromCamera };

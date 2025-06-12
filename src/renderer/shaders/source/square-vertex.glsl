attribute vec3 aVertexPosition;

uniform vec3 uPosition;

void main() {
    gl_Position = vec4(aVertexPosition + uPosition, 1.0);
}

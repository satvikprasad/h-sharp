attribute vec3 aVertexPosition;

uniform vec3 uPosition;
uniform vec2 uScale;
uniform vec4 uColor;

varying lowp vec4 vColor;

void main() {
    vec3 newVertexPos = aVertexPosition * vec3(uScale, 1.0);

    gl_Position = vec4(newVertexPos + uPosition, 1.0);

    vColor = uColor;
}

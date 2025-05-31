attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute float aVertexValue;

uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;

void main() {
    vec4 adjustedPosition = aVertexPosition + vec4(0.0, aVertexValue, 0.0, 0.0);

    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * adjustedPosition;

    vColor = aVertexColor * vec4(1.0, sqrt(sqrt(aVertexValue)), 1.0, 1.0);
}

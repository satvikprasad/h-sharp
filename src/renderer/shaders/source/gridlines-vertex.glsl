#version 300 es
precision mediump float;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 nearPoint;
out vec3 farPoint;
out mat4 fragView;
out mat4 fragProj;

vec3 gridPlane[6] = vec3[](
    vec3(1, 1, 0), vec3(-1, -1, 0), vec3(-1, 1, 0),
    vec3(-1, -1, 0), vec3(1, 1, 0), vec3(1, -1, 0)
);

vec3 UnprojectPoint(vec3 point, 
        mat4 view, 
        mat4 proj) {
    mat4 viewInv = inverse(view);
    mat4 projInv = inverse(proj);

    vec4 unprojected = viewInv * projInv * vec4(point.xyz, 1.0);

    return unprojected.xyz / unprojected.w;
}

void main() {
    vec3 p = gridPlane[gl_VertexID].xyz;

    nearPoint = UnprojectPoint(vec3(p.xy, 0.0), uViewMatrix, uProjectionMatrix).xyz;
    farPoint = UnprojectPoint(vec3(p.xy, 1.0), uViewMatrix, uProjectionMatrix).xyz;

    gl_Position = vec4(p, 1.0);

    fragView = uViewMatrix;
    fragProj = uProjectionMatrix;
}

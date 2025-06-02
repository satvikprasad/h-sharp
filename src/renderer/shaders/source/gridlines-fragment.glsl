#version 300 es
precision mediump float;

in vec4 fragColor;
in float fragScale;
in float fragWidth;

in vec3 nearPoint;
in vec3 farPoint;
in mat4 fragView;
in mat4 fragProj;

layout(location = 0) out vec4 outColor;

float computeDepth(vec3 worldPos) {
    vec4 clip_space_pos = fragProj * fragView * 
        vec4(worldPos.xyz, 1.0);

    return (clip_space_pos.z / clip_space_pos.w);
}

vec4 gridColor(vec3 point, float scale) {
    vec2 coord = point.xz * scale;

    vec2 fractional = abs(fract(coord-0.5) - 0.5);

    float alpha = 0.0;

    if (min(fractional.x, fractional.y) < fragWidth) {
        alpha = 1.0;
    }

    return fragColor * vec4(1.0, 1.0, 1.0, alpha);
}

void main() {
    /** We want to draw a pixel whenever the line segment
      from the near plane to the far plane crosses the line y=0
      within the viewing fulcrum.
      **/
    float t = -nearPoint.y / (farPoint.y - nearPoint.y);
    
    // World point where this line segment intersects 
    // the line y=0
    vec3 intersectionPoint = nearPoint + t * 
        (farPoint - nearPoint);

    if (t > 0.0) {
        outColor = gridColor(intersectionPoint, fragScale);
    } else {
        outColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
    
    gl_FragDepth = computeDepth(intersectionPoint);
}

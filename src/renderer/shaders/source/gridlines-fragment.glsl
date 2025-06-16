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

// Constants for fade out
const float FADE_START = 2.0;  // Distance at which fade starts
const float FADE_END = 15.0;   // Distance at which fade ends

float computeDepth(vec3 worldPos) {
    vec4 clip_space_pos = fragProj * fragView * 
        vec4(worldPos.xyz, 1.0);

    return (clip_space_pos.z / clip_space_pos.w);
}

vec4 gridColor(vec3 point, float scale) {
    vec2 coord = point.xz * scale;

    vec2 fractional = abs(fract(coord-0.5) - 0.5);
    
    // Calculate distance to the nearest grid line
    float dist = min(fractional.x, fractional.y);
    
    // Create a smooth transition for antialiasing
    // The width of the transition is controlled by fragWidth
    float alpha = 1.0 - smoothstep(0.03*fragWidth, fragWidth, dist);

    // Calculate distance from camera (assuming camera is at origin in view space)
    vec3 viewSpacePoint = (fragView * vec4(point, 0.0)).xyz;
    float distanceFromCamera = length(viewSpacePoint);
    
    // Apply distance-based fade out
    float distanceFade = 1.0 - smoothstep(FADE_START, FADE_END, distanceFromCamera);
    alpha *= distanceFade;

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

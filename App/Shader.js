import { ShaderMaterial } from 'three';

const VertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const FragmentShader = `
varying vec2 vUv;
uniform float time;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(random(i + vec2(0.0,0.0)), 
                   random(i + vec2(1.0,0.0)), u.x),
               mix(random(i + vec2(0.0,1.0)), 
                   random(i + vec2(1.0,1.0)), u.x), u.y);
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

void main() {
    vec2 st = vUv;
    st.x += sin(st.y * 10.0 + time) * 0.2; // Wave distortion
    st *= 10.0;
    float n = fbm(st + time * 0.5);
    vec3 color = mix(vec3(0.5, 0.8, 1.0), vec3(1.0, 0.6, 0.8), n);
    gl_FragColor = vec4(color, 0.2);
}

`;

const shimmerMaterial = new ShaderMaterial({
  vertexShader: VertexShader,
  fragmentShader: FragmentShader,
  uniforms: {
    time: { value: 0.0 },
  },
});

export { shimmerMaterial };

import type { Pattern } from '../store/schema'

// Generative patterns for layer C. Each is a fragment shader over a full-screen triangle;
// black means "no light", so screen/overlay blends leave the video untouched there.
// Uniforms: uRes (px), uBeats (beat clock), uHue (0..1).

const HEADER = `
precision mediump float;
uniform vec2 uRes;
uniform float uBeats;
uniform float uHue;
vec3 hsv(float h, float s, float v) {
    vec3 k = mod(vec3(5.0, 3.0, 1.0) + h * 6.0, 6.0);
    return v - v * s * clamp(min(k, 4.0 - k), 0.0, 1.0);
}
// 1 on the beat, decaying to 0 before the next
float pulse() { float f = fract(uBeats); return (1.0 - f) * (1.0 - f); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
}
`

const BODIES: Record<Pattern, string> = {
    plasma: `
void main() {
    vec2 uv = gl_FragCoord.xy / uRes.y;
    float t = uBeats * 0.25;
    float v = sin(uv.x * 6.0 + t) + sin(uv.y * 5.0 - t * 1.3) + sin((uv.x + uv.y) * 4.0 + t * 0.7)
            + sin(length(uv - vec2(0.9, 0.5)) * 8.0 - t * 2.0);
    float glow = 0.5 + 0.5 * sin(v * 1.5);
    gl_FragColor = vec4(hsv(uHue + v * 0.06, 0.75, glow * (0.7 + 0.3 * pulse())), 1.0);
}`,
    tunnel: `
void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float r = length(p);
    float a = atan(p.y, p.x);
    float depth = 0.3 / max(r, 0.001) + uBeats * 0.5;
    float ring = smoothstep(0.42, 0.5, abs(fract(depth) - 0.5));
    float spoke = smoothstep(0.85, 1.0, abs(sin(a * 4.0 + uBeats * 0.125)));
    float v = max(ring, spoke * 0.5) * smoothstep(0.02, 0.35, r);
    gl_FragColor = vec4(hsv(uHue + fract(depth * 0.25) * 0.15, 0.7, v * (0.75 + 0.25 * pulse())), 1.0);
}`,
    grid: `
void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float horizon = -0.05;
    vec3 col = vec3(0.0);
    if (p.y < horizon) {
        float z = 0.35 / (horizon - p.y);
        float x = p.x * z;
        float lx = abs(fract(x * 1.5) - 0.5);
        float lz = abs(fract(z - uBeats * 0.5) - 0.5);
        float line = 1.0 - smoothstep(0.0, 0.02 * z, min(lx, lz));
        col = hsv(uHue, 0.8, line * exp(-z * 0.12) * (0.8 + 0.2 * pulse()));
    }
    col += hsv(uHue + 0.08, 0.6, exp(-abs(p.y - horizon) * 18.0) * 0.6);
    gl_FragColor = vec4(col, 1.0);
}`,
    noise: `
void main() {
    vec2 uv = gl_FragCoord.xy / uRes.y * 2.5;
    float t = uBeats * 0.06;
    float warp = fbm(uv * 0.8 - vec2(t, t * 0.6));
    float v = fbm(uv + vec2(t * 1.4, -t) + warp * 1.6);
    float lit = smoothstep(0.35, 0.85, v);
    gl_FragColor = vec4(hsv(uHue + v * 0.2, 0.7, lit * (0.8 + 0.2 * pulse())), 1.0);
}`,
}

export const PATTERN_LABELS: Record<Pattern, string> = {
    plasma: 'Plasma',
    tunnel: 'Tunnel',
    grid: 'Grid',
    noise: 'Smoke',
}

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? 'shader compile failed')
    }
    return shader
}

export interface PatternRenderer {
    render: (beats: number, hue: number) => void
    dispose: () => void
}

// Returns null where WebGL is unavailable; the layer then simply stays empty
export function createPatternRenderer(canvas: HTMLCanvasElement, pattern: Pattern): PatternRenderer | null {
    const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false, powerPreference: 'low-power' })
    if (!gl) return null

    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, HEADER + BODIES[pattern]))
    gl.linkProgram(program)
    gl.useProgram(program)

    // One oversized triangle covers the viewport
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'uRes')
    const uBeats = gl.getUniformLocation(program, 'uBeats')
    const uHue = gl.getUniformLocation(program, 'uHue')

    return {
        render(beats, hue) {
            // Half resolution: the patterns are soft and this runs over two video layers
            const w = Math.max(1, Math.round(canvas.clientWidth / 2))
            const h = Math.max(1, Math.round(canvas.clientHeight / 2))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
                gl.viewport(0, 0, w, h)
            }
            gl.uniform2f(uRes, w, h)
            gl.uniform1f(uBeats, beats)
            gl.uniform1f(uHue, hue / 360)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        },
        dispose() {
            gl.deleteProgram(program)
            gl.deleteBuffer(buffer)
            // Not loseContext(): the same canvas gets a new program when the pattern changes
        },
    }
}

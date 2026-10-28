// WebGL2 renderer for the animated shader hero.
//
// The fragment shader is the procedural "space clouds" piece by Matthias Hurrle (@atzedent),
// as used by the 21st.dev animated-shader-hero component: value-noise fbm, a three-pass cloud
// field and eleven luminous orbiting layers, tinted warm amber and gold on black.
// The one addition is a `pointer` uniform (smoothed, -1..1) that gently parallaxes the cloud
// field and the light layers; at rest it is zero and the image matches the original.

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec4 position;
void main() { gl_Position = position; }`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform vec2 pointer;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x, R.y)
// Pseudo random number for a given point (white noise).
float rnd(vec2 p) {
  p = fract(p * vec2(12.9898, 78.233));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}
// Value noise.
float noise(in vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  float a = rnd(i), b = rnd(i + vec2(1, 0)), c = rnd(i + vec2(0, 1)), d = rnd(i + 1.);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
// Fractal noise.
float fbm(vec2 p) {
  float t = .0, a = 1.;
  mat2 m = mat2(1., -.5, .2, 1.2);
  for (int i = 0; i < 5; i++) {
    t += a * noise(p);
    p *= 2. * m;
    a *= .5;
  }
  return t;
}
float clouds(vec2 p) {
  float d = 1., t = .0;
  for (float i = .0; i < 3.; i++) {
    float a = d * fbm(i * 10. + p.x * .2 + .2 * (1. + i) * p.y + d + i * i + p);
    t = mix(t, d, a);
    d = a;
    p *= 2. / (i + 1.);
  }
  return t;
}
void main(void) {
  vec2 uv = (FC - .5 * R) / MN, st = uv * vec2(2, 1);
  vec3 col = vec3(0);
  float bg = clouds(vec2(st.x + T * .5 + pointer.x * .25, -st.y + pointer.y * .12));
  uv *= 1. - .3 * (sin(T * .2) * .5 + .5);
  uv -= pointer * .035;
  for (float i = 1.; i < 12.; i++) {
    uv += .1 * cos(i * vec2(.1 + .01 * i, .8) + i * i + T * .5 + .1 * uv.x);
    vec2 p = uv;
    float d = length(p);
    col += .00125 / d * (cos(sin(i) * vec3(1, 2, 3)) + 1.);
    float b = noise(i + p + bg * 1.731);
    col += .002 * b / length(max(p, vec2(b * p.x * .02, p.y)));
    col = mix(col, vec3(bg * .25, bg * .137, bg * .05), d);
  }
  O = vec4(col, 1);
}`

// Two triangles covering clip space, drawn as a strip.
const QUAD = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1])

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile failed: ${log}`)
  }
  return shader
}

export class ShaderHeroRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.gl = null
  }

  // Returns false (and leaves nothing allocated) if WebGL2 or the shader is unavailable.
  init() {
    const gl = this.canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' })
    if (!gl) return false
    this.gl = gl
    try {
      this.vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
      this.fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
      const program = gl.createProgram()
      gl.attachShader(program, this.vertex)
      gl.attachShader(program, this.fragment)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program)
        gl.deleteProgram(program)
        throw new Error(`Shader link failed: ${log}`)
      }
      this.program = program
    } catch (error) {
      console.warn('[AnimatedShaderHero]', error.message)
      this.dispose()
      return false
    }
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    this.buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW)
    const position = gl.getAttribLocation(this.program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'resolution'),
      time: gl.getUniformLocation(this.program, 'time'),
      pointer: gl.getUniformLocation(this.program, 'pointer'),
    }
    return true
  }

  // Size the drawing buffer to the canvas's CSS box times a capped pixel ratio.
  resize(cssWidth, cssHeight, pixelRatio) {
    const width = Math.max(1, Math.round(cssWidth * pixelRatio))
    const height = Math.max(1, Math.round(cssHeight * pixelRatio))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
  }

  render(seconds, pointerX = 0, pointerY = 0) {
    const { gl } = this
    if (!gl || !this.program || gl.isContextLost()) return
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.useProgram(this.program)
    gl.bindVertexArray(this.vao)
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height)
    gl.uniform1f(this.uniforms.time, seconds)
    gl.uniform2f(this.uniforms.pointer, pointerX, pointerY)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  dispose() {
    const { gl } = this
    if (!gl) return
    if (this.buffer) gl.deleteBuffer(this.buffer)
    if (this.vao) gl.deleteVertexArray(this.vao)
    if (this.program) gl.deleteProgram(this.program)
    if (this.vertex) gl.deleteShader(this.vertex)
    if (this.fragment) gl.deleteShader(this.fragment)
    // Hand the context back now rather than waiting for garbage collection.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    this.gl = null
    this.buffer = this.vao = this.program = this.vertex = this.fragment = null
  }
}

// Tracks the pointer relative to the canvas, eased so the shader never jitters.
// Listeners are passive and attached to the hero (not the canvas, which sits under the copy),
// so scrolling and touch navigation are never blocked.
export class PointerTracker {
  constructor(host, canvas) {
    this.host = host
    this.canvas = canvas
    this.target = { x: 0, y: 0 }
    this.value = { x: 0, y: 0 }
    this.onMove = (event) => {
      const rect = this.canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      this.target.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      // Flip y so it matches gl_FragCoord (origin bottom-left).
      this.target.y = 1 - ((event.clientY - rect.top) / rect.height) * 2
    }
    this.onLeave = () => { this.target.x = 0; this.target.y = 0 }
    host.addEventListener('pointermove', this.onMove, { passive: true })
    host.addEventListener('pointerleave', this.onLeave, { passive: true })
  }

  step(easing = 0.06) {
    this.value.x += (this.target.x - this.value.x) * easing
    this.value.y += (this.target.y - this.value.y) * easing
    return this.value
  }

  dispose() {
    this.host.removeEventListener('pointermove', this.onMove)
    this.host.removeEventListener('pointerleave', this.onLeave)
  }
}

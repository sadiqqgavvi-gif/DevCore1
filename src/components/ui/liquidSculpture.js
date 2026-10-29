// Liquid particle sculpture: geometry, a WebGL2 renderer (desktop) and a Canvas 2D renderer
// (phones, reduced motion, no WebGL2). Both read the same state: `form` (0 = a drifting liquid
// cloud, 1 = the finished sculpture), `spin` (scroll-driven turn) and, for WebGL only, time and
// the pointer, which parts the particles like a hand through water.
//
// The sculpture is the Gazette's own Fig. 1: two interlocking rings (design, engineering) with a
// dense core where they overlap.

const CREAM = [1.0, 0.91, 0.78]
const AMBER = [1.0, 0.66, 0.37]
const GOLD = [1.0, 0.84, 0.55]
const COLORS = [CREAM, AMBER, GOLD]
const CAMERA_Z = 6.4
const FOCAL = 3.4

function seeded(seed) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

// Rotate (x, y, z) by `yaw` around Y then `pitch` around X, written into out[o..o+2].
function rotate(x, y, z, yaw, pitch, out, o) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  out[o] = x1
  out[o + 1] = y * cp - z1 * sp
  out[o + 2] = y * sp + z1 * cp
}

export function buildSculpture(count) {
  const random = seeded(29)
  const target = new Float32Array(count * 3)
  const scatter = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const tone = new Float32Array(count)
  const tmp = new Float32Array(3)
  for (let i = 0; i < count; i += 1) {
    const kind = random()
    const o = i * 3
    if (kind < 0.09) {
      // The core: where design and engineering meet.
      const r = 0.32 * Math.cbrt(random())
      const a = random() * Math.PI * 2
      const b = Math.acos(2 * random() - 1)
      target[o] = r * Math.sin(b) * Math.cos(a)
      target[o + 1] = r * Math.sin(b) * Math.sin(a)
      target[o + 2] = r * Math.cos(b)
      tone[i] = 2
    } else {
      const ring = kind < 0.545 ? 0 : 1
      const theta = random() * Math.PI * 2
      const phi = random() * Math.PI * 2
      // Liquid: the tube swells and thins along the ring.
      const minor = (0.1 + 0.13 * (0.5 + 0.5 * Math.sin(theta * 3 + ring * 2.1))) * Math.sqrt(random())
      const major = 1.12
      const lx = (major + minor * Math.cos(phi)) * Math.cos(theta)
      const ly = (major + minor * Math.cos(phi)) * Math.sin(theta)
      const lz = minor * Math.sin(phi)
      rotate(lx, ly, lz, ring ? -0.55 : 0.55, ring ? 0.3 : -0.12, tmp, 0)
      target[o] = tmp[0] + (ring ? 0.52 : -0.52)
      target[o + 1] = tmp[1]
      target[o + 2] = tmp[2]
      tone[i] = ring
    }
    // The liquid cloud the sculpture condenses from.
    const r = 1.65 * Math.cbrt(random())
    const a = random() * Math.PI * 2
    const b = Math.acos(2 * random() - 1)
    scatter[o] = r * Math.sin(b) * Math.cos(a) * 1.1
    scatter[o + 1] = r * Math.sin(b) * Math.sin(a) * 0.9
    scatter[o + 2] = r * Math.cos(b)
    seed[i] = random()
  }
  return { count, target, scatter, seed, tone }
}

/* ---------- WebGL2 ---------- */

const VERTEX = `#version 300 es
precision highp float;
in vec3 aTarget;
in vec3 aScatter;
in float aSeed;
in float aTone;
uniform float uTime;
uniform float uForm;
uniform float uSpin;
uniform float uAspect;
uniform float uPixel;
uniform vec2 uPointer;
uniform float uPush;
out vec3 vColor;
out float vAlpha;
vec3 rot(vec3 p, float yaw, float pitch) {
  float cy = cos(yaw), sy = sin(yaw);
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
  float cp = cos(pitch), sp = sin(pitch);
  return vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
}
void main() {
  // Each particle arrives on its own beat, so the sculpture pours together rather than snaps.
  float f = clamp(uForm * 1.45 - aSeed * 0.45, 0.0, 1.0);
  f = f * f * (3.0 - 2.0 * f);
  float t = uTime;
  vec3 flow = vec3(
    sin(aScatter.y * 1.3 + t * 0.6 + aSeed * 6.2831),
    sin(aScatter.z * 1.1 + t * 0.5 + aSeed * 4.0),
    sin(aScatter.x * 1.2 + t * 0.7 + aSeed * 3.0));
  vec3 p = mix(aScatter + flow * 0.45, aTarget, f);
  // Surface ripple on the finished sculpture.
  p += normalize(aTarget + 0.0001) * sin(t * 1.6 + aSeed * 12.0 + aTarget.x * 3.0) * 0.035 * f;
  p = rot(p, -0.35 + uSpin * 2.2 + t * 0.12, -0.28 + sin(t * 0.25) * 0.05);
  vec4 clip = vec4(p.x * ${FOCAL.toFixed(2)} / uAspect, p.y * ${FOCAL.toFixed(2)}, 0.0, ${CAMERA_Z.toFixed(2)} - p.z);
  // The pointer parts the particles in screen space.
  vec2 ndc = clip.xy / clip.w;
  vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
  float dist = length(d);
  float push = uPush * smoothstep(0.42, 0.0, dist) * 0.22;
  ndc += normalize(d + 0.0001) / vec2(uAspect, 1.0) * push;
  gl_Position = vec4(ndc * clip.w, 0.0, clip.w);
  gl_PointSize = uPixel * (1.7 + aSeed * 2.0) * (${CAMERA_Z.toFixed(2)} / clip.w);
  vec3 c = aTone < 0.5 ? vec3(${CREAM.join(', ')}) : aTone < 1.5 ? vec3(${AMBER.join(', ')}) : vec3(${GOLD.join(', ')});
  vColor = c;
  vAlpha = mix(0.5, 0.92, f) * clamp(1.2 - (clip.w - ${CAMERA_Z.toFixed(2)}) * 0.35, 0.35, 1.0) + push * 2.0;
}`

const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 O;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vAlpha;
  O = vec4(vColor * a, a);
}`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Liquid sculpture shader: ${log}`)
  }
  return shader
}

export class SculptureGL {
  constructor(canvas, data) {
    this.canvas = canvas
    this.data = data
    this.gl = null
  }

  init() {
    const gl = this.canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true, powerPreference: 'high-performance' })
    if (!gl) return false
    this.gl = gl
    try {
      this.vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
      this.fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
      const program = gl.createProgram()
      gl.attachShader(program, this.vertex)
      gl.attachShader(program, this.fragment)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program)
        gl.deleteProgram(program)
        throw new Error(`Liquid sculpture link: ${log}`)
      }
      this.program = program
    } catch (error) {
      console.warn('[LiquidSculpture]', error.message)
      this.dispose()
      return false
    }
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    this.buffers = [['aTarget', this.data.target, 3], ['aScatter', this.data.scatter, 3], ['aSeed', this.data.seed, 1], ['aTone', this.data.tone, 1]].map(([name, values, size]) => {
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW)
      const location = gl.getAttribLocation(this.program, name)
      gl.enableVertexAttribArray(location)
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
      return buffer
    })
    this.uniforms = Object.fromEntries(['uTime', 'uForm', 'uSpin', 'uAspect', 'uPixel', 'uPointer', 'uPush'].map((name) => [name, gl.getUniformLocation(this.program, name)]))
    gl.enable(gl.BLEND)
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    return true
  }

  resize(width, height, ratio) {
    this.canvas.width = Math.max(1, Math.round(width * ratio))
    this.canvas.height = Math.max(1, Math.round(height * ratio))
    this.ratio = ratio
  }

  render({ time, form, spin, pointerX, pointerY, push }) {
    const { gl } = this
    if (!gl || gl.isContextLost()) return
    const { width, height } = this.canvas
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.program)
    gl.bindVertexArray(this.vao)
    const u = this.uniforms
    gl.uniform1f(u.uTime, time)
    gl.uniform1f(u.uForm, form)
    gl.uniform1f(u.uSpin, spin)
    gl.uniform1f(u.uAspect, width / height)
    gl.uniform1f(u.uPixel, this.ratio * Math.min(width, height) / 520)
    gl.uniform2f(u.uPointer, pointerX, pointerY)
    gl.uniform1f(u.uPush, push)
    gl.drawArrays(gl.POINTS, 0, this.data.count)
  }

  dispose() {
    const { gl } = this
    if (!gl) return
    this.buffers?.forEach((buffer) => gl.deleteBuffer(buffer))
    if (this.vao) gl.deleteVertexArray(this.vao)
    if (this.program) gl.deleteProgram(this.program)
    if (this.vertex) gl.deleteShader(this.vertex)
    if (this.fragment) gl.deleteShader(this.fragment)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    this.gl = null
  }
}

/* ---------- Canvas 2D (lighter: redrawn only when the scroll state changes) ---------- */

export class Sculpture2D {
  constructor(canvas, data) {
    this.canvas = canvas
    this.data = data
    this.ctx = canvas.getContext('2d')
    this.tmp = new Float32Array(3)
  }

  init() {
    return Boolean(this.ctx)
  }

  resize(width, height, ratio) {
    this.canvas.width = Math.max(1, Math.round(width * ratio))
    this.canvas.height = Math.max(1, Math.round(height * ratio))
    this.image = this.ctx.createImageData(this.canvas.width, this.canvas.height)
  }

  render({ form, spin }) {
    const { ctx, canvas, data, tmp, image } = this
    if (!ctx || !image) return
    const w = canvas.width
    const h = canvas.height
    const pixels = image.data
    pixels.fill(0)
    const aspect = w / h
    const yaw = -0.35 + spin * 2.2
    const pitch = -0.28
    for (let i = 0; i < data.count; i += 1) {
      let f = Math.min(1, Math.max(0, form * 1.45 - data.seed[i] * 0.45))
      f = f * f * (3 - 2 * f)
      const o = i * 3
      const x = data.scatter[o] + (data.target[o] - data.scatter[o]) * f
      const y = data.scatter[o + 1] + (data.target[o + 1] - data.scatter[o + 1]) * f
      const z = data.scatter[o + 2] + (data.target[o + 2] - data.scatter[o + 2]) * f
      rotate(x, y, z, yaw, pitch, tmp, 0)
      const depth = CAMERA_Z - tmp[2]
      const px = ((tmp[0] * FOCAL) / aspect / depth * 0.5 + 0.5) * w
      const py = (0.5 - (tmp[1] * FOCAL) / depth * 0.5) * h
      if (px < 0 || py < 0 || px >= w - 2 || py >= h - 2) continue
      const color = COLORS[data.tone[i]]
      const alpha = (0.5 + 0.45 * f) * Math.min(1, Math.max(0.35, 1.2 - (depth - CAMERA_Z) * 0.35)) * 255
      // 2×2 dabs. Image data is not premultiplied, so colour takes the brightest particle and
      // opacity accumulates: overlapping particles glow, like the additive WebGL version.
      const base = ((py | 0) * w + (px | 0)) * 4
      const r = color[0] * 255, g = color[1] * 255, b = color[2] * 255
      for (const offset of [0, 4, w * 4, w * 4 + 4]) {
        const k = base + offset
        if (pixels[k] < r) pixels[k] = r
        if (pixels[k + 1] < g) pixels[k + 1] = g
        if (pixels[k + 2] < b) pixels[k + 2] = b
        pixels[k + 3] = Math.min(255, pixels[k + 3] + alpha)
      }
    }
    ctx.putImageData(image, 0, 0)
  }

  dispose() {
    this.ctx = null
  }
}

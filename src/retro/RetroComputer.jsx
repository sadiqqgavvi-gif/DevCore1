import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const BEIGE = '#d9cdb5'
const BEIGE_DARK = '#b8aa90'
const SCREEN_W = 1024
const SCREEN_H = 768
const SCREEN_FPS = 30

/* ---------- Base unit dimensions (one source of truth for body and keyboard) ---------- */

const BASE_W = 3.4
const BEVEL = 0.03
// Side profile, in base-local z (front is +z) and y.
const PROFILE = { front: 1.45, back: -1.2, frontH: 0.2, backH: 0.5, breakZ: -0.2 }
const SLOPE_ANGLE = Math.atan2(PROFILE.backH - PROFILE.frontH, PROFILE.front - PROFILE.breakZ)
const SLOPE_LENGTH = Math.hypot(PROFILE.backH - PROFILE.frontH, PROFILE.front - PROFILE.breakZ)
const SLOPE_CENTER = {
  z: (PROFILE.front + PROFILE.breakZ) / 2,
  y: (PROFILE.frontH + PROFILE.backH) / 2 + BEVEL,
}
const BASE_DEPTH = PROFILE.front - PROFILE.back

/* ---------- Keyboard layout, in key units (u) ---------- */

// Each row lists key widths in u. 'm' = modifier colour, 'a' = accent, default = alpha key.
const MAIN_ROWS = [
  [[1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [2, 'm']],
  [[1.5, 'm'], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1.5, 'm']],
  [[1.75, 'm'], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [2.25, 'a']],
  [[2.25, 'm'], [1], [1], [1], [1], [1], [1], [1], [1], [1], [1], [2.75, 'm']],
  [[1.25, 'm'], [1.25, 'm'], [1.25, 'm'], [6.25], [1.25, 'm'], [1.25, 'm'], [1.25, 'm'], [1.25, 'm']],
]
const NUMPAD_ROWS = [
  [[1, 'm'], [1, 'm'], [1, 'm'], [1, 'm']],
  [[1], [1], [1], [1, 'm']],
  [[1], [1], [1], [1, 'm']],
  [[1], [1], [1], [1, 'a']],
  [[2], [1], [1, 'm']],
]
const FUNCTION_ROW = Array.from({ length: 12 }, () => [1, 'f'])
const MAIN_WIDTH_U = 15
const NUMPAD_WIDTH_U = 4
const NUMPAD_GAP_U = 0.5
const KEYBOARD_MARGIN = 0.22
const KEY_U = (BASE_W - KEYBOARD_MARGIN * 2) / (MAIN_WIDTH_U + NUMPAD_GAP_U + NUMPAD_WIDTH_U)
const KEY_GAP = KEY_U * 0.14
const KEY_HEIGHT = KEY_U * 0.42
const FN_DEPTH_U = 0.7
const KEY_COLORS = { alpha: '#2c2622', m: '#8b8071', a: '#e0794a', f: '#5d544b' }

function buildKeyLayout() {
  const keys = []
  const rowsDepthU = FN_DEPTH_U + 0.25 + MAIN_ROWS.length
  // Centre the keyboard on the slope; rows run from the back (-z) to the front (+z).
  const startZ = -(rowsDepthU * KEY_U) / 2
  const left = -(BASE_W / 2) + KEYBOARD_MARGIN

  const placeRow = (row, originX, z, depthU) => {
    let cursor = originX
    row.forEach(([width, kind]) => {
      keys.push({
        x: cursor + (width * KEY_U) / 2,
        z: z + (depthU * KEY_U) / 2,
        w: width * KEY_U - KEY_GAP,
        d: depthU * KEY_U - KEY_GAP,
        kind: kind || 'alpha',
      })
      cursor += width * KEY_U
    })
  }

  // Function row: 12 keys in three groups of four, like the machines it nods to.
  FUNCTION_ROW.forEach((key, index) => {
    const group = Math.floor(index / 4)
    keys.push({
      x: left + (index + group * 0.5 + 0.5) * KEY_U,
      z: startZ + (FN_DEPTH_U * KEY_U) / 2,
      w: KEY_U - KEY_GAP,
      d: FN_DEPTH_U * KEY_U - KEY_GAP,
      kind: 'f',
    })
  })

  const mainZ = startZ + (FN_DEPTH_U + 0.25) * KEY_U
  MAIN_ROWS.forEach((row, index) => placeRow(row, left, mainZ + index * KEY_U, 1))
  const numpadLeft = left + (MAIN_WIDTH_U + NUMPAD_GAP_U) * KEY_U
  NUMPAD_ROWS.forEach((row, index) => placeRow(row, numpadLeft, mainZ + index * KEY_U, 1))

  return { keys, well: { w: BASE_W - KEYBOARD_MARGIN * 2 + KEY_U * 0.5, d: rowsDepthU * KEY_U + KEY_U * 0.5 } }
}

/* ---------- Screen painting: static layers cached, animated parts drawn per frame ---------- */

function roundedRect(shape, x, y, w, h, r) {
  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return shape
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  lines.push(line)
  return lines
}

function drawGlyph(ctx, glyph, t, ink, mid) {
  ctx.save()
  ctx.translate(SCREEN_W * 0.7, SCREEN_H * 0.36)
  ctx.lineWidth = 14
  ctx.strokeStyle = mid
  ctx.fillStyle = mid
  if (glyph === 'shop') {
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath()
      ctx.ellipse(0, 0, 60 + i * 42, 46 + i * 34, t * (0.6 + i * 0.25) + i, 0.3, Math.PI * 1.7)
      ctx.stroke()
    }
  } else if (glyph === 'orbit') {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath()
      ctx.ellipse(0, 0, 190, 64, i * (Math.PI / 3) + t * 0.2, 0, Math.PI * 2)
      ctx.lineWidth = 6
      ctx.stroke()
      const a = t * (1.2 + i * 0.4) + i * 2
      const rot = i * (Math.PI / 3) + t * 0.2
      const px = Math.cos(a) * 190
      const py = Math.sin(a) * 64
      ctx.beginPath()
      ctx.arc(px * Math.cos(rot) - py * Math.sin(rot), px * Math.sin(rot) + py * Math.cos(rot), 18, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.arc(0, 0, 40, 0, Math.PI * 2)
    ctx.fill()
  } else if (glyph === 'bars') {
    for (let i = 0; i < 7; i += 1) {
      const h = 60 + (Math.sin(t * 2 + i * 0.9) * 0.5 + 0.5) * 180
      ctx.fillRect(-220 + i * 64, 120 - h, 42, h)
    }
    ctx.fillStyle = ink
    ctx.fillRect(-240, 128, 470, 8)
  } else {
    for (let gx = 0; gx < 5; gx += 1) {
      for (let gy = 0; gy < 4; gy += 1) {
        const pulse = Math.sin(t * 2.4 - (gx + gy) * 0.7) * 0.5 + 0.5
        const s = 22 + pulse * 30
        ctx.globalAlpha = 0.45 + pulse * 0.55
        ctx.fillRect(-200 + gx * 90 - s / 2, -140 + gy * 90 - s / 2, s, s)
      }
    }
    ctx.globalAlpha = 1
  }
  ctx.restore()
}

function layer(scale, height = SCREEN_H) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(SCREEN_W * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  return { canvas, ctx }
}

// Paints the CRT screen. Background, text and the scanline/vignette overlay only change when
// the project changes, so they are rendered once into offscreen layers and composited.
class ScreenPainter {
  constructor(scale) {
    this.scale = scale
    this.out = layer(scale)
    this.base = layer(scale)
    this.text = layer(scale)
    this.overlay = layer(scale, SCREEN_H + 4)
    this.project = null
    const o = this.overlay.ctx
    o.fillStyle = 'rgba(0,0,0,0.1)'
    for (let y = 0; y < SCREEN_H + 4; y += 4) o.fillRect(0, y, SCREEN_W, 1.6)
    const vignette = o.createRadialGradient(SCREEN_W / 2, SCREEN_H / 2, SCREEN_W * 0.42, SCREEN_W / 2, SCREEN_H / 2, SCREEN_W * 0.72)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)')
    o.fillStyle = vignette
    o.fillRect(0, 0, SCREEN_W, SCREEN_H + 4)
  }

  setProject(project) {
    if (this.project === project) return
    this.project = project
    const [paper, mid, ink] = project.screen
    const b = this.base.ctx
    const bg = b.createRadialGradient(SCREEN_W / 2, SCREEN_H / 2, 80, SCREEN_W / 2, SCREEN_H / 2, SCREEN_W * 0.7)
    bg.addColorStop(0, '#fffdf4')
    bg.addColorStop(0.35, paper)
    bg.addColorStop(1, mid)
    b.fillStyle = bg
    b.fillRect(0, 0, SCREEN_W, SCREEN_H)

    const c = this.text.ctx
    c.clearRect(0, 0, SCREEN_W, SCREEN_H)
    c.fillStyle = ink
    c.font = '600 26px "VT323", "Courier New", monospace'
    c.fillText(`${project.number} / 04  ${project.kicker}`, 110, 118)
    c.font = '700 80px "STIX Two Text", Georgia, serif'
    const lines = wrapLines(c, project.title, SCREEN_W - 240)
    const baseY = SCREEN_H - 170 - (lines.length - 1) * 80
    lines.forEach((line, index) => c.fillText(line, 110, baseY + index * 80))
    c.font = 'italic 400 38px "STIX Two Text", Georgia, serif'
    c.fillText(project.line, 112, SCREEN_H - 112)
  }

  // Fonts can arrive after the first paint; repaint the cached text once they do.
  invalidate() {
    const project = this.project
    this.project = null
    if (project) this.setProject(project)
  }

  draw(t, glitch) {
    const { ctx, canvas } = this.out
    const [, mid, ink] = this.project.screen
    ctx.drawImage(this.base.canvas, 0, 0, SCREEN_W, SCREEN_H)
    drawGlyph(ctx, this.project.glyph, t, ink, mid)
    ctx.drawImage(this.text.canvas, 0, 0, SCREEN_W, SCREEN_H)
    ctx.fillStyle = ink
    if (Math.floor(t * 1.6) % 2 === 0) ctx.fillRect(SCREEN_W - 140, 96, 28, 28)

    if (glitch > 0) {
      const s = this.scale
      for (let i = 0; i < 26 * glitch; i += 1) {
        const y = Math.random() * SCREEN_H
        const h = 4 + Math.random() * 40
        ctx.drawImage(canvas, 0, y * s, canvas.width, h * s, (Math.random() - 0.5) * 120 * glitch, y, SCREEN_W, h)
      }
      ctx.globalAlpha = glitch * 0.65
      for (let i = 0; i < 600 * glitch; i += 1) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#111'
        ctx.fillRect(Math.random() * SCREEN_W, Math.random() * SCREEN_H, 3 + Math.random() * 8, 2)
      }
      ctx.globalAlpha = 1
    }

    ctx.drawImage(this.overlay.canvas, 0, -((t * 40) % 4), SCREEN_W, SCREEN_H + 4)
  }

  dispose() {
    ;[this.out, this.base, this.text, this.overlay].forEach((item) => { item.canvas.width = 0 })
  }
}

function makeBadgeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1d1a18'
  ctx.fillRect(0, 0, 512, 96)
  const colors = ['#e8483a', '#f08a2c', '#f2c94c', '#4bb36b', '#3d7be0']
  colors.forEach((color, index) => {
    ctx.fillStyle = color
    ctx.fillRect(22, 18 + index * 12, 56, 7)
  })
  ctx.fillStyle = '#efe6d2'
  ctx.font = 'italic 700 54px "STIX Two Text", Georgia, serif'
  ctx.fillText('DEVCORE', 98, 68)
  ctx.font = '22px "VT323", monospace'
  ctx.fillText('PERSONAL STUDIO 64', 340, 66)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(0,0,0,0.75)')
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.35)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(canvas)
}

function useComputerGeometry() {
  const geometry = useMemo(() => {
    const bezelShape = roundedRect(new THREE.Shape(), -1.25, -1.05, 2.5, 2.1, 0.16)
    bezelShape.holes.push(roundedRect(new THREE.Path(), -1.02, -0.62, 2.04, 1.5, 0.12))
    const bezel = new THREE.ExtrudeGeometry(bezelShape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 })

    // Tapered CRT body: pull the back face in so the housing reads as a tube, not a box.
    const housing = new THREE.BoxGeometry(2.42, 2.02, 1.2, 1, 1, 1)
    const pos = housing.attributes.position
    for (let i = 0; i < pos.count; i += 1) {
      if (pos.getZ(i) < 0) {
        pos.setX(i, pos.getX(i) * 0.68)
        pos.setY(i, pos.getY(i) * 0.7 + 0.08)
      }
    }
    housing.computeVertexNormals()

    const screen = new THREE.PlaneGeometry(2.04, 1.5, 24, 24)
    const sp = screen.attributes.position
    for (let i = 0; i < sp.count; i += 1) {
      const nx = sp.getX(i) / 1.02
      const ny = sp.getY(i) / 0.75
      sp.setZ(i, 0.07 * (1 - nx * nx * 0.9) * (1 - ny * ny * 0.9))
    }
    screen.computeVertexNormals()

    const profile = new THREE.Shape()
    profile.moveTo(PROFILE.front, 0)
    profile.lineTo(PROFILE.back, 0)
    profile.lineTo(PROFILE.back, PROFILE.backH)
    profile.lineTo(PROFILE.breakZ, PROFILE.backH)
    profile.lineTo(PROFILE.front, PROFILE.frontH)
    profile.lineTo(PROFILE.front, 0)
    const base = new THREE.ExtrudeGeometry(profile, { depth: BASE_W, bevelEnabled: true, bevelSize: BEVEL, bevelThickness: BEVEL, bevelSegments: 2 })
    base.rotateY(-Math.PI / 2)
    base.translate(BASE_W / 2, 0, 0)

    // Keycap: slightly tapered so the tops read as caps rather than flat tiles.
    const keycap = new THREE.BoxGeometry(1, 1, 1)
    const kp = keycap.attributes.position
    for (let i = 0; i < kp.count; i += 1) {
      if (kp.getY(i) > 0) {
        kp.setX(i, kp.getX(i) * 0.84)
        kp.setZ(i, kp.getZ(i) * 0.8 - 0.04)
      }
    }
    keycap.computeVertexNormals()

    return { bezel, housing, screen, base, keycap }
  }, [])

  useEffect(() => () => Object.values(geometry).forEach((item) => item.dispose()), [geometry])
  return geometry
}

function Keyboard({ keycap }) {
  const ref = useRef(null)
  const layout = useMemo(() => buildKeyLayout(), [])

  useEffect(() => {
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    layout.keys.forEach((key, index) => {
      // Keycaps rest on the well floor; their tops sit just proud of the case surface.
      dummy.position.set(key.x, KEY_HEIGHT / 2 - 0.012, key.z)
      dummy.scale.set(key.w, KEY_HEIGHT, key.d)
      dummy.updateMatrix()
      ref.current.setMatrixAt(index, dummy.matrix)
      ref.current.setColorAt(index, color.set(KEY_COLORS[key.kind]))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
  }, [layout])

  return (
    <group position={[0, SLOPE_CENTER.y, SLOPE_CENTER.z]} rotation={[SLOPE_ANGLE, 0, 0]}>
      <mesh position={[0, -0.006, 0]}>
        <boxGeometry args={[layout.well.w, 0.02, layout.well.d]} />
        <meshStandardMaterial color="#171412" roughness={0.9} />
      </mesh>
      <instancedMesh ref={ref} args={[keycap, undefined, layout.keys.length]}>
        <meshStandardMaterial roughness={0.48} metalness={0.05} />
      </instancedMesh>
      <mesh position={[0, 0.004, SLOPE_LENGTH / 2 - 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BASE_W - 0.6, 0.012]} />
        <meshBasicMaterial color="#8b8071" />
      </mesh>
    </group>
  )
}

const easeOut = (t) => 1 - (1 - t) ** 3

function Computer({ projects, activeIndex, progressRef, reducedMotion, introDelay }) {
  const group = useRef(null)
  const screenLight = useRef(null)
  const screenMaterial = useRef(null)
  const glitch = useRef(0)
  const lastIndex = useRef(activeIndex)
  const accumulator = useRef(1)
  const { viewport } = useThree()
  const geo = useComputerGeometry()

  const { painter, texture } = useMemo(() => {
    const p = new ScreenPainter(window.innerWidth < 760 ? 0.6 : 1)
    p.setProject(projects[activeIndex])
    const tex = new THREE.CanvasTexture(p.out.canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return { painter: p, texture: tex }
  // The painter is created once; project changes are handled per frame.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const badge = useMemo(() => makeBadgeTexture(), [])
  const shadow = useMemo(() => makeShadowTexture(), [])

  useEffect(() => {
    let alive = true
    document.fonts.ready.then(() => { if (alive) painter.invalidate() })
    return () => {
      alive = false
      texture.dispose()
      badge.dispose()
      shadow.dispose()
      painter.dispose()
    }
  }, [texture, badge, shadow, painter])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const project = projects[activeIndex]
    if (lastIndex.current !== activeIndex) {
      lastIndex.current = activeIndex
      glitch.current = 1
      painter.setProject(project)
    }
    glitch.current = Math.max(0, glitch.current - delta * 3.2)

    // The screen repaints at ~30fps (every frame while glitching); the 3D scene stays at full rate.
    accumulator.current += delta
    if (glitch.current > 0 || accumulator.current >= 1 / SCREEN_FPS) {
      accumulator.current = 0
      painter.draw(reducedMotion ? 0 : t, glitch.current)
      screenMaterial.current.map.needsUpdate = true
    }

    const progress = progressRef.current
    const exit = THREE.MathUtils.clamp((progress - 0.86) / 0.14, 0, 1)
    const enter = reducedMotion ? 1 : easeOut(THREE.MathUtils.clamp((t - introDelay) / 1.6, 0, 1))

    if (screenLight.current) {
      screenLight.current.color.set(project.screen[0])
      screenLight.current.intensity = (5 + Math.sin(t * 30) * 0.25 - glitch.current * 2) * (0.4 + enter * 0.6) + exit * 6
    }

    const wide = viewport.aspect > 1.05
    const targetX = (wide ? Math.min(viewport.width * 0.24, 3.2) : 0) * (1 - exit)
    const targetY = (wide ? -1.35 : -1.2) - (1 - enter) * 1.4 - exit * 0.9
    const scale = (wide ? Math.min(1, viewport.width / 11) : Math.min(0.7, viewport.width / 4.5)) * (1 + exit * 1.6)
    const pointer = state.pointer
    const g = group.current
    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 4, delta)
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY + (reducedMotion ? 0 : Math.sin(t * 0.8) * 0.035), 4, delta)
    g.position.z = THREE.MathUtils.damp(g.position.z, exit * 2.2, 4, delta)
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, scale, 4, delta))
    const yaw = (wide ? -0.5 : -0.24) * (1 - exit) + (1 - enter) * 0.7 + (reducedMotion ? 0 : pointer.x * 0.1 + progress * 0.3 * (1 - exit))
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, yaw, 3, delta)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, reducedMotion ? 0.04 : 0.04 - pointer.y * 0.05 + progress * 0.05, 3, delta)

    // A slow dolly-in across the carousel gives the object weight without competing with it.
    if (!reducedMotion) {
      state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 9 - progress * 0.9, 3, delta)
      state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 1.1 - progress * 0.25, 3, delta)
      state.camera.lookAt(0, 0.1, 0)
    }
  })

  const beige = <meshStandardMaterial color={BEIGE} roughness={0.62} metalness={0.02} />

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0.1]} scale={[BASE_W * 1.7, BASE_DEPTH * 1.5, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <mesh geometry={geo.base}>{beige}</mesh>
      <mesh position={[0, 0.012, (PROFILE.front + PROFILE.back) / 2]}>
        <boxGeometry args={[BASE_W + BEVEL * 2 + 0.02, 0.024, BASE_DEPTH + BEVEL * 2 + 0.02]} />
        <meshStandardMaterial color={BEIGE_DARK} roughness={0.8} />
      </mesh>
      <Keyboard keycap={geo.keycap} />
      <mesh position={[1.12, PROFILE.backH + BEVEL + 0.004, -0.62]}>
        <boxGeometry args={[0.62, 0.012, 0.07]} />
        <meshStandardMaterial color="#1b1816" />
      </mesh>
      <mesh position={[-1.42, PROFILE.backH + BEVEL + 0.012, -0.5]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshBasicMaterial color="#ff4b3a" toneMapped={false} />
      </mesh>

      {/* Monitor: its neck rests exactly on the flat top of the base. */}
      <group position={[0, PROFILE.backH + BEVEL + 1.1 * 1.28, -0.62]} scale={1.28}>
        <mesh position={[0, -1.02, -0.2]}>
          <boxGeometry args={[1.2, 0.16, 0.8]} />
          <meshStandardMaterial color={BEIGE_DARK} roughness={0.7} />
        </mesh>
        <mesh geometry={geo.housing} position={[0, 0, -0.48]}>{beige}</mesh>
        <mesh geometry={geo.bezel} position={[0, 0, 0.1]}>{beige}</mesh>
        <mesh position={[0, 0.13, 0.06]}>
          <planeGeometry args={[2.2, 1.66]} />
          <meshStandardMaterial color="#0d0c0b" roughness={0.9} />
        </mesh>
        <mesh geometry={geo.screen} position={[0, 0.13, 0.17]}>
          <meshBasicMaterial ref={screenMaterial} map={texture} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.84, 0.335]}>
          <planeGeometry args={[1.25, 0.234]} />
          <meshBasicMaterial map={badge} toneMapped={false} />
        </mesh>
        <pointLight ref={screenLight} position={[0, 0.1, 1.2]} distance={6} decay={1.6} intensity={5} />
      </group>
    </group>
  )
}

function Lights({ progressRef }) {
  const key = useRef(null)
  const rim = useRef(null)
  const warm = useMemo(() => new THREE.Color('#ffe2c4'), [])
  const cool = useMemo(() => new THREE.Color('#d9d2ff'), [])
  useFrame(() => {
    // Light drifts from warm studio key to a cooler, rim-heavy look as the carousel advances.
    const p = progressRef.current
    key.current.color.lerpColors(warm, cool, p)
    key.current.intensity = 2.1 - p * 0.5
    rim.current.intensity = 2.2 + p * 2
  })
  return (
    <>
      <hemisphereLight args={['#c9b2ff', '#120a18', 0.55]} />
      <directionalLight ref={key} position={[-4, 6, 5]} intensity={2.1} color="#ffe2c4" />
      <directionalLight ref={rim} position={[5, 2, -4]} intensity={2.2} color="#b28cff" />
      <spotLight position={[2, 6, 3]} angle={0.5} penumbra={0.8} intensity={30} color="#fff1df" />
    </>
  )
}

export default function RetroComputer({ projects, activeIndex, progressRef, reducedMotion, introDelay = 0 }) {
  const wrapRef = useRef(null)
  const [visible, setVisible] = useState(true)
  const [dpr] = useState(() => [1, window.innerWidth < 760 ? 1.5 : 1.75])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(wrapRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="retro-computer" ref={wrapRef} aria-hidden="true">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={dpr}
        camera={{ position: [0, 1.1, 9], fov: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
      >
        <Lights progressRef={progressRef} />
        <Computer projects={projects} activeIndex={activeIndex} progressRef={progressRef} reducedMotion={reducedMotion} introDelay={introDelay} />
      </Canvas>
    </div>
  )
}

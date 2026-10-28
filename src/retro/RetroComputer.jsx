import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const BEIGE = '#d9cdb5'
const BEIGE_DARK = '#b8aa90'
const SCREEN_W = 1024
const SCREEN_H = 768

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

function drawScreen(ctx, project, t, glitch) {
  const [paper, mid, ink] = project.screen
  const bg = ctx.createRadialGradient(SCREEN_W / 2, SCREEN_H / 2, 80, SCREEN_W / 2, SCREEN_H / 2, SCREEN_W * 0.7)
  bg.addColorStop(0, '#fffdf4')
  bg.addColorStop(0.35, paper)
  bg.addColorStop(1, mid)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

  drawGlyph(ctx, project.glyph, t, ink, mid)

  ctx.fillStyle = ink
  ctx.font = '600 26px "VT323", "Courier New", monospace'
  ctx.fillText(`${project.number} / 04  ${project.kicker}`, 110, 118)

  ctx.font = '700 80px "STIX Two Text", Georgia, serif'
  const lines = wrapLines(ctx, project.title, SCREEN_W - 240)
  const baseY = SCREEN_H - 170 - (lines.length - 1) * 80
  lines.forEach((line, index) => ctx.fillText(line, 110, baseY + index * 80))
  ctx.font = 'italic 400 38px "STIX Two Text", Georgia, serif'
  ctx.fillText(project.line, 112, SCREEN_H - 112)

  if (Math.floor(t * 1.6) % 2 === 0) ctx.fillRect(SCREEN_W - 140, 96, 28, 28)

  if (glitch > 0) {
    for (let i = 0; i < 26 * glitch; i += 1) {
      const y = Math.random() * SCREEN_H
      const h = 4 + Math.random() * 40
      ctx.drawImage(ctx.canvas, 0, y, SCREEN_W, h, (Math.random() - 0.5) * 120 * glitch, y, SCREEN_W, h)
    }
    ctx.globalAlpha = glitch * 0.65
    for (let i = 0; i < 900 * glitch; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#111'
      ctx.fillRect(Math.random() * SCREEN_W, Math.random() * SCREEN_H, 3 + Math.random() * 8, 2)
    }
    ctx.globalAlpha = 1
  }

  ctx.fillStyle = 'rgba(0,0,0,0.1)'
  for (let y = (t * 40) % 4; y < SCREEN_H; y += 4) ctx.fillRect(0, y, SCREEN_W, 1.6)

  const vignette = ctx.createRadialGradient(SCREEN_W / 2, SCREEN_H / 2, SCREEN_W * 0.42, SCREEN_W / 2, SCREEN_H / 2, SCREEN_W * 0.72)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
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

function useComputerGeometry() {
  return useMemo(() => {
    const bezelShape = roundedRect(new THREE.Shape(), -1.25, -1.05, 2.5, 2.1, 0.16)
    bezelShape.holes.push(roundedRect(new THREE.Path(), -1.02, -0.62, 2.04, 1.5, 0.12))
    const bezel = new THREE.ExtrudeGeometry(bezelShape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 })

    // Tapered CRT body: pull the back face in so the housing reads as a tube, not a box.
    const housing = new THREE.BoxGeometry(2.42, 2.02, 1.5, 1, 1, 1)
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

    // Keyboard unit side profile, extruded across the width.
    const profile = new THREE.Shape()
    profile.moveTo(1.45, 0)
    profile.lineTo(-1.2, 0)
    profile.lineTo(-1.2, 0.5)
    profile.lineTo(-0.2, 0.5)
    profile.lineTo(1.45, 0.2)
    profile.lineTo(1.45, 0)
    const base = new THREE.ExtrudeGeometry(profile, { depth: 3.4, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 })
    base.rotateY(-Math.PI / 2)
    base.translate(1.7, 0, 0)

    return { bezel, housing, screen, base }
  }, [])
}

function Keys() {
  const ref = useRef(null)
  const layout = useMemo(() => {
    const keys = []
    for (let row = 0; row < 5; row += 1) {
      const count = row === 4 ? 0 : 14
      for (let col = 0; col < count; col += 1) keys.push([-1.33 + col * 0.19 + (row % 2) * 0.05, row, 0.16])
    }
    for (let col = 0; col < 3; col += 1) for (let row = 0; row < 4; row += 1) keys.push([1.38 + col * 0.19, row, 0.16])
    return keys
  }, [])

  useEffect(() => {
    const dummy = new THREE.Object3D()
    layout.forEach(([x, row], index) => {
      dummy.position.set(x, 0.04, -0.62 + row * 0.2)
      dummy.updateMatrix()
      ref.current.setMatrixAt(index, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [layout])

  return (
    <group position={[0, 0.355, 0.62]} rotation={[0.18, 0, 0]}>
      <instancedMesh ref={ref} args={[undefined, undefined, layout.length]} castShadow>
        <boxGeometry args={[0.16, 0.07, 0.16]} />
        <meshStandardMaterial color="#2a2522" roughness={0.55} />
      </instancedMesh>
      <mesh position={[-0.1, 0.04, 0.2]}>
        <boxGeometry args={[1.5, 0.07, 0.16]} />
        <meshStandardMaterial color="#2a2522" roughness={0.55} />
      </mesh>
    </group>
  )
}

function Computer({ projects, activeIndex, progressRef, reducedMotion }) {
  const group = useRef(null)
  const screenLight = useRef(null)
  const screenMaterial = useRef(null)
  const glitch = useRef(0)
  const lastIndex = useRef(activeIndex)
  const { viewport, pointer } = useThree()
  const geo = useComputerGeometry()

  const { canvas, ctx, texture } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = SCREEN_W
    c.height = SCREEN_H
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return { canvas: c, ctx: c.getContext('2d'), texture: tex }
  }, [])
  const badge = useMemo(() => makeBadgeTexture(), [])

  useEffect(() => () => {
    texture.dispose()
    badge.dispose()
    canvas.width = 0
  }, [texture, badge, canvas])

  useFrame((state, delta) => {
    if (lastIndex.current !== activeIndex) {
      lastIndex.current = activeIndex
      glitch.current = 1
    }
    glitch.current = Math.max(0, glitch.current - delta * 3.2)
    const t = state.clock.elapsedTime
    const project = projects[activeIndex]
    drawScreen(ctx, project, t, glitch.current)
    screenMaterial.current.map.needsUpdate = true

    if (screenLight.current) {
      screenLight.current.color.set(project.screen[0])
      screenLight.current.intensity = 5 + Math.sin(t * 30) * 0.25 - glitch.current * 2
    }

    const wide = viewport.aspect > 1.05
    const targetX = wide ? Math.min(viewport.width * 0.24, 3.2) : 0
    const targetY = wide ? -1.35 : -1.55
    const scale = wide ? Math.min(1, viewport.width / 11) : Math.min(0.78, viewport.width / 3.6)
    const progress = progressRef.current
    const g = group.current
    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 4, delta)
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY + (reducedMotion ? 0 : Math.sin(t * 0.8) * 0.04), 4, delta)
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, scale, 4, delta))
    const yaw = (wide ? -0.5 : -0.22) + (reducedMotion ? 0 : pointer.x * 0.12 + progress * 0.28)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, yaw, 3, delta)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, reducedMotion ? 0.04 : 0.04 - pointer.y * 0.05, 3, delta)
  })

  const beige = <meshStandardMaterial color={BEIGE} roughness={0.62} metalness={0.02} />

  return (
    <group ref={group}>
      <mesh geometry={geo.base} castShadow receiveShadow>{beige}</mesh>
      <mesh position={[0, 0.005, 0]} scale={[1.01, 0.12, 1.01]}>
        <boxGeometry args={[3.4, 0.2, 2.65]} />
        <meshStandardMaterial color={BEIGE_DARK} roughness={0.8} />
      </mesh>
      <Keys />
      <mesh position={[1.25, 0.505, -0.55]}>
        <boxGeometry args={[0.7, 0.02, 0.08]} />
        <meshStandardMaterial color="#1b1816" />
      </mesh>
      <mesh position={[-1.4, 0.51, -0.4]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#ff4b3a" toneMapped={false} />
      </mesh>

      <group position={[0, 1.95, -0.6]} scale={1.28}>
        <mesh position={[0, -1.02, -0.2]}>
          <boxGeometry args={[1.2, 0.16, 0.9]} />
          <meshStandardMaterial color={BEIGE_DARK} roughness={0.7} />
        </mesh>
        <mesh geometry={geo.housing} position={[0, 0, -0.62]} castShadow>{beige}</mesh>
        <mesh geometry={geo.bezel} position={[0, 0, 0.1]} castShadow>{beige}</mesh>
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

export default function RetroComputer({ projects, activeIndex, progressRef, reducedMotion }) {
  const wrapRef = useRef(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(wrapRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="retro-computer" ref={wrapRef} aria-hidden="true">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.1, 9], fov: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
      >
        <hemisphereLight args={['#c9b2ff', '#120a18', 0.55]} />
        <directionalLight position={[-4, 6, 5]} intensity={2.1} color="#ffe2c4" />
        <directionalLight position={[5, 2, -4]} intensity={2.4} color="#b28cff" />
        <spotLight position={[2, 6, 3]} angle={0.5} penumbra={0.8} intensity={30} color="#fff1df" />
        <Computer projects={projects} activeIndex={activeIndex} progressRef={progressRef} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}

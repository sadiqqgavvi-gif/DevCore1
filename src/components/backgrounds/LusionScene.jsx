import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

const COUNT = 600

function Fallback() {
  return (
    <div className="environment-fallback" role="img" aria-label="Abstract orbital sculpture">
      <div className="environment-fallback-orbit environment-fallback-orbit-one" />
      <div className="environment-fallback-orbit environment-fallback-orbit-two" />
      <div className="environment-fallback-core"><span /></div>
    </div>
  )
}

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <Fallback /> : this.props.children }
}

function rng(seed) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function makeCore() {
  const geometry = new THREE.IcosahedronGeometry(1, 3)
  const pos = geometry.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i).normalize()
    const n = Math.sin(v.x * 7 + v.z * 3) * Math.cos(v.y * 6 - v.x * 2) * 0.06 + Math.sin((v.x + v.y + v.z) * 10) * 0.02
    v.multiplyScalar(1.1 * (1 + n))
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

/** Renders only while the hero is on screen (motionState.active), so the canvas is idle for the rest of the page. */
function Driver({ motionState, enabled }) {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    invalidate()
    if (!enabled) return undefined
    let raf = 0
    const tick = () => {
      if (motionState.current.active && !document.hidden) invalidate()
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [enabled, invalidate, motionState])
  return null
}

function World({ motionState, reduced }) {
  const group = useRef(null)
  const core = useRef(null)
  const shards = useRef(null)
  const shardMaterial = useRef(null)
  const keyLight = useRef(null)
  const time = useRef(0)
  const coreGeometry = useMemo(() => makeCore(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tint = useMemo(() => new THREE.Color(), [])
  const seeds = useMemo(() => {
    const r = rng(97)
    return Array.from({ length: COUNT }, () => ({
      a: r() * Math.PI * 2, radius: 1.7 + r() * 2.8, y: (r() - 0.5) * 1.6,
      speed: 0.04 + r() * 0.12, size: 0.018 + r() * 0.05, phase: r() * 6,
    }))
  }, [])

  useFrame((state, delta) => {
    const m = motionState.current
    if (!reduced) time.current += delta
    const t = time.current
    const p = reduced ? 0 : m.progress
    const pp = reduced ? 0 : m.pageProgress
    const px = reduced ? 0 : state.pointer.x
    const py = reduced ? 0 : state.pointer.y
    const wide = state.size.width > 900
    const damp = THREE.MathUtils.damp

    const cam = state.camera
    cam.position.x = damp(cam.position.x, px * 0.5, 2.5, delta)
    cam.position.y = damp(cam.position.y, py * 0.3, 2.5, delta)
    cam.position.z = damp(cam.position.z, 6.6 - p * 2.4, 3, delta)
    cam.lookAt(0, 0, 0)

    if (group.current) {
      group.current.position.x = damp(group.current.position.x, wide ? 1.5 - p * 1.5 : 0, 3, delta)
      group.current.position.y = damp(group.current.position.y, wide ? 0 : 1.1 - p * 1.1, 3, delta)
      group.current.rotation.y = pp * 0.6 + t * 0.02
    }
    if (core.current) {
      core.current.rotation.y = t * 0.12 + p * Math.PI * 2
      core.current.rotation.x = 0.25 + py * 0.2 + Math.sin(t * 0.3) * 0.05
      core.current.scale.setScalar(1 + p * 0.55)
    }
    if (shards.current) {
      const spread = 1 + p * 0.9
      for (let i = 0; i < COUNT; i += 1) {
        const s = seeds[i]
        const a = s.a + t * s.speed + p * s.speed * 8
        dummy.position.set(Math.cos(a) * s.radius * spread, s.y * spread + Math.sin(t * 0.4 + s.phase) * 0.08, Math.sin(a) * s.radius * 0.62 * spread - 0.4)
        dummy.rotation.set(a * 2, a, s.phase)
        dummy.scale.setScalar(s.size * (1 + p * 0.6))
        dummy.updateMatrix()
        shards.current.setMatrixAt(i, dummy.matrix)
      }
      shards.current.instanceMatrix.needsUpdate = true
    }
    tint.setHSL(0.62 + pp * 0.14, 0.65, 0.6)
    if (shardMaterial.current) shardMaterial.current.color.copy(tint)
    if (keyLight.current) {
      keyLight.current.color.copy(tint)
      keyLight.current.position.set(2.6 + px * 1.2, 1.8 + py * 0.9, 3.6)
    }
  })

  return (
    <group ref={group}>
      <ambientLight intensity={0.4} color="#9aa7ff" />
      <hemisphereLight args={['#aebcff', '#07080c', 0.5]} />
      <pointLight ref={keyLight} intensity={30} distance={14} />
      <pointLight position={[-3.5, -1.5, -2]} color="#7a4dff" intensity={18} distance={9} />
      <pointLight position={[0, -3, 2]} color="#2f9bff" intensity={10} distance={8} />
      <group ref={core}>
        <mesh geometry={coreGeometry}>
          <meshPhysicalMaterial color="#141a45" metalness={0.85} roughness={0.2} clearcoat={1} clearcoatRoughness={0.12} iridescence={0.6} iridescenceIOR={1.3} iridescenceThicknessRange={[150, 450]} emissive="#1a2278" emissiveIntensity={0.25} flatShading />
        </mesh>
        <mesh scale={1.32}>
          <icosahedronGeometry args={[1.1, 2]} />
          <meshBasicMaterial color="#b4c5ff" wireframe transparent opacity={0.1} depthWrite={false} />
        </mesh>
        <mesh scale={0.38}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#d9ecff" />
        </mesh>
      </group>
      <mesh rotation={[1.2, 0.2, 0.3]}>
        <torusGeometry args={[1.9, 0.006, 8, 200]} />
        <meshBasicMaterial color="#9fb4ff" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[0.4, -0.5, -0.6]}>
        <torusGeometry args={[2.35, 0.005, 8, 200]} />
        <meshBasicMaterial color="#b58cff" transparent opacity={0.4} />
      </mesh>
      <instancedMesh ref={shards} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial ref={shardMaterial} metalness={0.6} roughness={0.35} emissive="#2a3a99" emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  )
}

export default function LusionScene({ motionState }) {
  const reduced = useReducedMotion()
  const [webgl] = useState(() => {
    try {
      const canvas = document.createElement('canvas')
      return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
    } catch {
      return false
    }
  })

  if (!webgl) return <Fallback />
  return (
    <Boundary>
      <Canvas
        className="environment-canvas"
        camera={{ position: [0, 0, 6.6], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <Driver motionState={motionState} enabled={!reduced} />
        <World motionState={motionState} reduced={reduced} />
      </Canvas>
    </Boundary>
  )
}

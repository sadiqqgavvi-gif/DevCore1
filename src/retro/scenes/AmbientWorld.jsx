import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// One shared world behind Chapters 05 and 07 (the Gazette, Chapters 08 and 09 draw their own).
// Each chapter's environment sits further down the z axis; the camera travels between them with
// scroll and fog hides the rest.
const ANCHORS = [-70, -140]
// Camera travel per chapter, as [start, end] offsets from its anchor. The camera stays outside
// each chapter's objects so nothing balloons across the text.
const CAMERA_TRAVEL = [[18, 2], [26, 15]]
const CAMERA_SWAY = [1.2, 0.8]
const FOG = '#07060d'
const AMBER = '#ffb36b'
const CYAN = '#5fe3ff'
const VIOLET = '#9b7cff'

const scratch = new THREE.Object3D()
const lookTarget = new THREE.Vector3()

function seeded(seed) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

function edges(geometry) {
  const result = new THREE.EdgesGeometry(geometry)
  geometry.dispose()
  return result
}

function useResources(mobile) {
  const resources = useMemo(() => {
    const random = seeded(11)
    const glow = makeGlowTexture()

    // The Gazette's paper sheets and ink motes used to be drawn first from this seeded sequence.
    // Consume the same values so every environment below keeps exactly the same layout.
    for (let i = 0, n = (mobile ? 9 : 16) * 9 + (mobile ? 260 : 700) * 3; i < n; i += 1) random()

    // 05 — wireframe engineering forms.
    const forms = [
      new THREE.IcosahedronGeometry(2.1, 1),
      new THREE.BoxGeometry(2.6, 2.6, 2.6, 2, 2, 2),
      new THREE.OctahedronGeometry(1.8, 0),
      new THREE.TorusGeometry(1.5, 0.45, 8, 22),
      new THREE.DodecahedronGeometry(1.6, 0),
    ].map(edges)
    const formPlaces = [[-7, 1.5, -6], [7.5, -0.5, -10], [-4.5, -2, 4], [5, 2.6, 2], [0, 3.6, -16]]

    // 07 — constellation nodes on three shells, each wired to its two nearest neighbours.
    const nodeCount = mobile ? 30 : 48
    const nodes = []
    for (let i = 0; i < nodeCount; i += 1) {
      const shell = [3, 5, 7.2][i % 3]
      const y = 1 - (i / (nodeCount - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = i * 2.399963
      nodes.push(new THREE.Vector3(Math.cos(theta) * r * shell, y * shell * 0.55, Math.sin(theta) * r * shell))
    }
    const links = []
    nodes.forEach((node, i) => {
      nodes
        .map((other, j) => [j, node.distanceTo(other)])
        .filter(([j]) => j !== i)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 2)
        .forEach(([j]) => { if (i < j) links.push(node, nodes[j]) })
    })
    const linkGeometry = new THREE.BufferGeometry().setFromPoints(links)
    const ring = (radius) => new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, radius, radius).getPoints(96).map((p) => new THREE.Vector3(p.x, 0, p.y)))
    const orbits = [ring(3), ring(5), ring(7.2)]

    const nodeGeometry = new THREE.SphereGeometry(0.06, 10, 10)
    return {
      glow, forms, formPlaces, nodes, linkGeometry, linkCount: links.length,
      orbits, nodeGeometry,
    }
  }, [mobile])

  useEffect(() => () => {
    const r = resources
    ;[r.glow, r.linkGeometry, r.nodeGeometry,
      ...r.forms, ...r.orbits].forEach((item) => item.dispose())
  }, [resources])

  return resources
}

function Glow({ position, color, size, opacity = 0.6, texture }) {
  return (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </sprite>
  )
}

function Build({ r, stateRef }) {
  const forms = useRef([])
  useFrame((state, delta) => {
    const p = stateRef.current.progress[0]
    forms.current.forEach((mesh, index) => {
      if (!mesh) return
      mesh.rotation.x += delta * (0.05 + index * 0.02)
      mesh.rotation.y += delta * (0.08 + index * 0.015)
      mesh.position.y = r.formPlaces[index][1] + (p - 0.5) * (index % 2 ? 2 : -2)
    })
  })
  return (
    <group position={[0, 0, ANCHORS[0]]}>
      <gridHelper args={[90, 45, CYAN, '#20354a']} position={[0, -4.5, 0]} material-transparent material-opacity={0.32} />
      {r.forms.map((geometry, index) => (
        <lineSegments key={index} ref={(mesh) => { forms.current[index] = mesh }} geometry={geometry} position={r.formPlaces[index]}>
          <lineBasicMaterial color={index % 2 ? CYAN : AMBER} transparent opacity={0.75} toneMapped={false} />
        </lineSegments>
      ))}
      {r.formPlaces.map((place, index) => <Glow key={index} texture={r.glow} position={place} color={index % 2 ? CYAN : AMBER} size={6} opacity={0.18} />)}
    </group>
  )
}

function Ecosystem({ r, stateRef }) {
  const group = useRef(null)
  const nodes = useRef(null)
  const links = useRef(null)
  useEffect(() => {
    const color = new THREE.Color()
    r.nodes.forEach((node, index) => {
      scratch.position.copy(node)
      scratch.rotation.set(0, 0, 0)
      scratch.scale.setScalar(1)
      scratch.updateMatrix()
      nodes.current.setMatrixAt(index, scratch.matrix)
      nodes.current.setColorAt(index, color.set([CYAN, VIOLET, AMBER][index % 3]))
    })
    nodes.current.instanceMatrix.needsUpdate = true
    nodes.current.instanceColor.needsUpdate = true
  }, [r])
  useFrame((state, delta) => {
    // The ecosystem wires itself up as the chapter is read; it turns slowly, never spins.
    const reveal = THREE.MathUtils.clamp(stateRef.current.progress[1] * 1.6 - 0.15, 0, 1)
    links.current.geometry.setDrawRange(0, Math.floor(r.linkCount * reveal / 2) * 2)
    nodes.current.count = Math.max(1, Math.round(r.nodes.length * Math.min(1, reveal * 1.4)))
    group.current.rotation.y += delta * 0.04
  })
  return (
    <group position={[0, 0, ANCHORS[1]]}>
      <group ref={group} rotation={[0.25, 0, 0]} position={[0, 0, -2]}>
        <instancedMesh ref={nodes} args={[r.nodeGeometry, undefined, r.nodes.length]}>
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
        <lineSegments ref={links} geometry={r.linkGeometry}>
          <lineBasicMaterial color={CYAN} transparent opacity={0.35} toneMapped={false} />
        </lineSegments>
        {r.orbits.map((geometry, index) => (
          <lineLoop key={index} geometry={geometry} rotation={[index * 0.35, 0, index * 0.2]}>
            <lineBasicMaterial color={index === 1 ? VIOLET : '#3a5a8a'} transparent opacity={0.5} toneMapped={false} />
          </lineLoop>
        ))}
      </group>
      <Glow texture={r.glow} position={[0, 0, 0]} color={VIOLET} size={9} opacity={0.4} />
      <Glow texture={r.glow} position={[0, 0, 0]} color={CYAN} size={4} opacity={0.5} />
    </group>
  )
}

function CameraRig({ stateRef }) {
  useFrame(({ camera, pointer }, delta) => {
    // The current chapter is the visible one closest to the middle of the screen.
    stateRef.current.measure?.()
    const { progress } = stateRef.current
    let zone = -1
    progress.forEach((p, index) => {
      if (p > 0 && p < 1 && (zone < 0 || Math.abs(p - 0.5) < Math.abs(progress[zone] - 0.5))) zone = index
    })
    if (zone < 0) return
    const p = progress[zone]
    const [from, to] = CAMERA_TRAVEL[zone]
    const sway = CAMERA_SWAY[zone]
    const z = ANCHORS[zone] + from + (to - from) * p
    const x = pointer.x * 0.6 * sway + Math.sin(p * Math.PI) * sway
    const y = 0.8 - p * 0.9 + pointer.y * 0.3
    // A jump (deep link, nav, fast flick, first frame) cuts straight to the chapter instead of
    // flying visibly through every environment in between; ordinary scrolling still glides.
    if (Math.abs(camera.position.z - z) > 40) {
      camera.position.set(x, y, z)
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 2.5, delta)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 2.5, delta)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 2.2, delta)
    }
    lookTarget.set(camera.position.x * 0.3, 0, camera.position.z - 20)
    camera.lookAt(lookTarget)
  })
  return null
}

export default function AmbientWorld({ active, stateRef, onReady }) {
  const mobile = window.innerWidth < 760
  const r = useResources(mobile)
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, mobile ? 1 : 1.5]}
      camera={{ position: [0, 0.8, 16], fov: 55, near: 0.1, far: 90 }}
      gl={{ antialias: !mobile, powerPreference: 'high-performance' }}
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 8, 48]} />
      <hemisphereLight args={['#bca9ff', '#0a0710', 0.5]} />
      <directionalLight position={[4, 8, 6]} intensity={1.2} color="#ffe2c4" />
      <Build r={r} stateRef={stateRef} />
      <Ecosystem r={r} stateRef={stateRef} />
      <CameraRig stateRef={stateRef} />
    </Canvas>
  )
}

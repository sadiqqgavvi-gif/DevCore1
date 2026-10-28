import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const GRID = 6
const COUNT = GRID * GRID * GRID
const STEP = 0.44
const scratch = new THREE.Object3D()
const PALETTE = ['#e8483a', '#f08a2c', '#f2c94c', '#4bb36b', '#3d7be0', '#7a5cd6']

function seeded(seed) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function Modules({ progressRef, reducedMotion }) {
  const mesh = useRef(null)
  const group = useRef(null)
  const { pointer } = useThree()

  const resources = useMemo(() => {
    const random = seeded(42)
    const half = ((GRID - 1) * STEP) / 2
    const pieces = []
    for (let x = 0; x < GRID; x += 1) {
      for (let y = 0; y < GRID; y += 1) {
        for (let z = 0; z < GRID; z += 1) {
          const target = new THREE.Vector3(x * STEP - half, y * STEP - half, z * STEP - half)
          const direction = new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize()
          pieces.push({
            target,
            start: direction.multiplyScalar(4 + random() * 5).add(new THREE.Vector3(0, 0, -1)),
            spin: new THREE.Euler(random() * 6, random() * 6, random() * 6),
            delay: target.length() / (half * Math.sqrt(3)),
          })
        }
      }
    }
    return {
      pieces,
      geometry: new THREE.BoxGeometry(0.38, 0.38, 0.38),
      material: new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1, emissive: '#ffb36b', emissiveIntensity: 0 }),
    }
  }, [])

  useEffect(() => {
    const random = seeded(9)
    const color = new THREE.Color()
    resources.pieces.forEach((_, index) => {
      const roll = random()
      color.set(roll < 0.12 ? PALETTE[index % PALETTE.length] : roll < 0.4 ? '#2a2522' : '#d9cdb5')
      mesh.current.setColorAt(index, color)
    })
    mesh.current.instanceColor.needsUpdate = true
    return () => {
      resources.geometry.dispose()
      resources.material.dispose()
    }
  }, [resources])

  useFrame((state, delta) => {
    const dummy = scratch
    const raw = reducedMotion ? 1 : THREE.MathUtils.clamp((progressRef.current - 0.08) / 0.7, 0, 1)
    resources.pieces.forEach((piece, index) => {
      // Inner modules lock in first, the outer shell last.
      const local = easeInOut(THREE.MathUtils.clamp(raw * 1.5 - piece.delay * 0.5, 0, 1))
      dummy.position.lerpVectors(piece.start, piece.target, local)
      dummy.rotation.set(piece.spin.x * (1 - local), piece.spin.y * (1 - local), piece.spin.z * (1 - local))
      dummy.scale.setScalar(0.6 + local * 0.4)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.material.emissiveIntensity = raw > 0.95 ? 0.08 + Math.sin(state.clock.elapsedTime * 2) * 0.04 : 0

    const g = group.current
    if (!reducedMotion) g.rotation.y += delta * (0.12 + (1 - raw) * 0.2)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.45 - pointer.y * 0.25, 3, delta)
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, pointer.x * 0.12, 3, delta)
  })

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[resources.geometry, resources.material, COUNT]} />
    </group>
  )
}

export default function AssemblerScene({ active, progressRef, reducedMotion }) {
  return (
    <Canvas frameloop={active ? 'always' : 'never'} dpr={[1, window.innerWidth < 760 ? 1.25 : 1.5]} camera={{ position: [0, 0.4, 9], fov: 34 }} gl={{ antialias: true, alpha: true }}>
      <hemisphereLight args={['#d9c8ff', '#120a10', 0.7]} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} color="#fff0dc" />
      <directionalLight position={[-5, -2, -4]} intensity={1.4} color="#8f74ff" />
      <Modules progressRef={progressRef} reducedMotion={reducedMotion} />
    </Canvas>
  )
}

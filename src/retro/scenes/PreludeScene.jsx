import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BG = '#0d0a10'
const ARCHES = 7
const ARCH_GAP = 7
const SPAN = 3.2
const scratch = new THREE.Object3D()
const lookTarget = new THREE.Vector3()

function seeded(seed) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function Architecture({ reducedMotion }) {
  const pillars = useRef(null)
  const crowns = useRef(null)
  const monoliths = useRef(null)

  const resources = useMemo(() => {
    const random = seeded(7)
    const blocks = Array.from({ length: 22 }, (_, index) => {
      const side = index % 2 === 0 ? -1 : 1
      return {
        position: new THREE.Vector3(side * (5.5 + random() * 7), 0.8 + random() * 7, 4 - random() * 48),
        scale: new THREE.Vector3(0.4 + random() * 1.4, 0.6 + random() * 3.2, 0.4 + random() * 1.4),
        speed: (random() - 0.5) * 0.4,
        phase: random() * Math.PI * 2,
      }
    })
    return {
      blocks,
      pillar: new THREE.BoxGeometry(0.7, 6, 0.7),
      crown: new THREE.TorusGeometry(SPAN, 0.35, 10, 36, Math.PI),
      block: new THREE.BoxGeometry(1, 1, 1),
      plaster: new THREE.MeshStandardMaterial({ color: '#cdbfa6', roughness: 0.92 }),
      stone: new THREE.MeshStandardMaterial({ color: '#2b2430', roughness: 0.7, metalness: 0.15 }),
    }
  }, [])

  useEffect(() => () => {
    resources.pillar.dispose()
    resources.crown.dispose()
    resources.block.dispose()
    resources.plaster.dispose()
    resources.stone.dispose()
  }, [resources])

  useEffect(() => {
    const dummy = new THREE.Object3D()
    for (let i = 0; i < ARCHES; i += 1) {
      const z = -i * ARCH_GAP
      const twist = (i % 2 ? 1 : -1) * 0.06
      ;[-SPAN, SPAN].forEach((x, side) => {
        dummy.position.set(x, 3, z)
        dummy.rotation.set(0, twist, 0)
        dummy.updateMatrix()
        pillars.current.setMatrixAt(i * 2 + side, dummy.matrix)
      })
      dummy.position.set(0, 6, z)
      dummy.rotation.set(0, twist, 0)
      dummy.updateMatrix()
      crowns.current.setMatrixAt(i, dummy.matrix)
    }
    pillars.current.instanceMatrix.needsUpdate = true
    crowns.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame((state) => {
    const dummy = scratch
    const t = reducedMotion ? 0 : state.clock.elapsedTime
    resources.blocks.forEach((block, index) => {
      dummy.position.copy(block.position)
      dummy.position.y += Math.sin(t * 0.5 + block.phase) * 0.25
      dummy.rotation.set(block.phase * 0.2, block.phase + t * block.speed, 0)
      dummy.scale.copy(block.scale)
      dummy.updateMatrix()
      monoliths.current.setMatrixAt(index, dummy.matrix)
    })
    monoliths.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={pillars} args={[resources.pillar, resources.plaster, ARCHES * 2]} />
      <instancedMesh ref={crowns} args={[resources.crown, resources.plaster, ARCHES]} />
      <instancedMesh ref={monoliths} args={[resources.block, resources.stone, resources.blocks.length]} />
      {Array.from({ length: ARCHES }, (_, index) => (
        <mesh key={index} position={[0, 0.02, -index * ARCH_GAP]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SPAN * 2, 0.06]} />
          <meshBasicMaterial color="#ffb36b" toneMapped={false} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
        <planeGeometry args={[60, 90]} />
        <meshStandardMaterial color="#151017" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, 4, -ARCHES * ARCH_GAP - 4]}>
        <circleGeometry args={[3.4, 48]} />
        <meshBasicMaterial color="#ffd7a8" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 4, -ARCHES * ARCH_GAP]} intensity={40} distance={30} color="#ffbf86" />
    </group>
  )
}

function CameraRig({ progressRef, reducedMotion }) {
  useFrame(({ camera, pointer }, delta) => {
    const look = lookTarget
    const p = reducedMotion ? 0.35 : progressRef.current
    const z = 11 - p * 44
    const x = Math.sin(p * Math.PI * 2) * 0.9 + (reducedMotion ? 0 : pointer.x * 0.4)
    const y = 1.7 + Math.sin(p * Math.PI) * 0.8 + (reducedMotion ? 0 : pointer.y * 0.2)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 3, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 3, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 3, delta)
    look.set(camera.position.x * 0.4, 2.6, camera.position.z - 12)
    camera.lookAt(look)
  })
  return null
}

export default function PreludeScene({ active, progressRef, reducedMotion }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.7, 11], fov: 44, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 6, 40]} />
      <hemisphereLight args={['#bca9ff', '#140d10', 0.7]} />
      <directionalLight position={[6, 10, 6]} intensity={1.5} color="#ffe2c4" />
      <directionalLight position={[-8, 4, -10]} intensity={1.1} color="#9b7cff" />
      <Architecture reducedMotion={reducedMotion} />
      <CameraRig progressRef={progressRef} reducedMotion={reducedMotion} />
    </Canvas>
  )
}

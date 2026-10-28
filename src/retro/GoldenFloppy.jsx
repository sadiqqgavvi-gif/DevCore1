import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

function Environment() {
  const get = useThree((state) => state.get)
  useEffect(() => {
    const { gl, scene } = get()
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [get])
  return null
}

function Floppy({ spinRef, reducedMotion }) {
  const group = useRef(null)
  const { pointer } = useThree()

  const body = useMemo(() => {
    const s = 1.5
    const shape = new THREE.Shape()
    shape.moveTo(-s, -s)
    shape.lineTo(s, -s)
    shape.lineTo(s, s - 0.22)
    shape.lineTo(s - 0.22, s)
    shape.lineTo(-s, s)
    shape.lineTo(-s, -s)
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 4 })
    geometry.center()
    return geometry
  }, [])
  useEffect(() => () => body.dispose(), [body])

  const gold = <meshStandardMaterial color="#e3b04b" metalness={1} roughness={0.2} />

  useFrame((state, delta) => {
    spinRef.current = THREE.MathUtils.damp(spinRef.current, reducedMotion ? 0 : 0.6, 1.4, delta)
    const g = group.current
    g.rotation.y += delta * spinRef.current
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -0.18 - pointer.y * 0.2, 3, delta)
    g.position.y = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.1) * 0.08
  })

  return (
    <group ref={group} scale={0.86}>
      <mesh geometry={body}>{gold}</mesh>
      {[1, -1].map((side) => (
        <group key={side} position={[0, 0, side * 0.125]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
          <mesh position={[0.15, 1.0, 0]}>
            <boxGeometry args={[1.5, 0.95, 0.03]} />
            <meshStandardMaterial color="#c9cdd2" metalness={1} roughness={0.28} />
          </mesh>
          <mesh position={[0.45, 1.0, 0.02]}>
            <boxGeometry args={[0.34, 0.6, 0.02]} />
            <meshStandardMaterial color="#3a2a0e" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.55, 0]}>
            <boxGeometry args={[2.3, 1.6, 0.02]} />
            <meshStandardMaterial color="#f3d88a" metalness={0.85} roughness={0.32} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function GoldenFloppyScene({ active, spinRef, reducedMotion }) {
  return (
    <Canvas frameloop={active ? 'always' : 'never'} dpr={[1, 1.75]} camera={{ position: [0, 0.3, 7], fov: 32 }} gl={{ alpha: true, antialias: true }}>
      <Environment />
      <spotLight position={[0, 6, 3]} angle={0.45} penumbra={0.7} intensity={60} color="#fff0cc" />
      <directionalLight position={[-3, 1, 4]} intensity={1.2} color="#ffd38a" />
      <Floppy spinRef={spinRef} reducedMotion={reducedMotion} />
    </Canvas>
  )
}

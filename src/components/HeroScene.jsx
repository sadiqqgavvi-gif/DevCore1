import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

class SceneBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return <SceneFallback />
    return this.props.children
  }
}

function SceneFallback() {
  return (
    <div className="environment-fallback" role="img" aria-label="Abstract orbital sculpture">
      <div className="environment-fallback-orbit environment-fallback-orbit-one" />
      <div className="environment-fallback-orbit environment-fallback-orbit-two" />
      <div className="environment-fallback-core"><span /></div>
    </div>
  )
}

function createCoreGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1.13, 2)
  const positions = geometry.attributes.position
  const color = new THREE.Color()
  const colors = new Float32Array(positions.count * 3)

  for (let index = 0; index < positions.count; index += 1) {
    const vertex = new THREE.Vector3().fromBufferAttribute(positions, index).normalize()
    const wave = Math.sin(vertex.x * 8 + vertex.z * 3) * Math.cos(vertex.y * 7 - vertex.x * 2)
    const ridge = Math.sin((vertex.x + vertex.y + vertex.z) * 11)
    const radius = 1 + wave * 0.045 + ridge * 0.018
    positions.setXYZ(index, vertex.x * radius, vertex.y * radius, vertex.z * radius)
    color.setHSL(0.61 + vertex.y * 0.045 + wave * 0.018, 0.48, 0.23 + ridge * 0.05)
    colors[index * 3] = color.r
    colors[index * 3 + 1] = color.g
    colors[index * 3 + 2] = color.b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

function createOrbitGeometry(offset = 0) {
  const points = []
  for (let index = 0; index <= 72; index += 1) {
    const progress = (index / 72) * Math.PI * 2
    const radius = 1.48 + Math.cos(progress * 2 + offset) * 0.19
    points.push(new THREE.Vector3(
      Math.cos(progress + offset) * radius,
      Math.sin(progress * 2 + offset) * 0.27,
      Math.sin(progress + offset) * radius * 0.72,
    ))
  }

  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 120, 0.008, 5, false)
}

function createEnvironmentGeometry() {
  const positions = []
  const colors = []
  const color = new THREE.Color()
  let seed = 41

  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  for (let index = 0; index < 280; index += 1) {
    const x = (random() - 0.5) * 15
    const y = (random() - 0.5) * 9
    const z = -random() * 9 - 1
    positions.push(x, y, z)
    color.setHSL(0.59 + random() * 0.11, 0.47, 0.54 + random() * 0.24)
    colors.push(color.r, color.g, color.b)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return geometry
}

function createSpatialGridGeometry() {
  const positions = []
  for (let x = -10; x <= 10; x += 0.8) positions.push(x, -6, 0, x, 6, 0)
  for (let y = -6; y <= 6; y += 0.8) positions.push(-10, y, 0, 10, y, 0)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

function ExperienceWorld({ motionState, reducedMotion }) {
  const world = useRef(null)
  const sculpture = useRef(null)
  const orbitGroup = useRef(null)
  const architecture = useRef(null)
  const distantLayer = useRef(null)
  const gridLayer = useRef(null)
  const gridMaterial = useRef(null)
  const keyLight = useRef(null)
  const ambient = useRef(null)
  const elapsed = useRef(0)
  const coreGeometry = useMemo(() => createCoreGeometry(), [])
  const orbitGeometryOne = useMemo(() => createOrbitGeometry(0.3), [])
  const orbitGeometryTwo = useMemo(() => createOrbitGeometry(2.2), [])
  const environmentGeometry = useMemo(() => createEnvironmentGeometry(), [])
  const spatialGridGeometry = useMemo(() => createSpatialGridGeometry(), [])
  const chapterColors = useMemo(() => [
    new THREE.Color('#111a50'),
    new THREE.Color('#161b3a'),
    new THREE.Color('#10283b'),
    new THREE.Color('#211b43'),
    new THREE.Color('#102b34'),
    new THREE.Color('#17203d'),
    new THREE.Color('#263d71'),
    new THREE.Color('#201d43'),
  ], [])
  const keyLightColor = useMemo(() => new THREE.Color('#a9c7ff'), [])
  const ambientLightColor = useMemo(() => new THREE.Color('#99aaff'), [])
  const chapterTarget = useRef(new THREE.Color('#111a50'))
  const currentChapter = useRef(0)

  useFrame((state, delta) => {
    elapsed.current += delta
    const time = elapsed.current
    const progress = motionState.current.progress
    const pageProgress = reducedMotion ? 0 : motionState.current.pageProgress
    const chapter = reducedMotion ? 0 : motionState.current.chapter
    currentChapter.current = THREE.MathUtils.damp(currentChapter.current, chapter, 2.4, delta)
    const lowChapter = Math.floor(currentChapter.current)
    const highChapter = Math.min(chapterColors.length - 1, lowChapter + 1)
    const mix = currentChapter.current - lowChapter
    chapterTarget.current.copy(chapterColors[lowChapter]).lerp(chapterColors[highChapter], mix)

    if (world.current) {
      world.current.traverse((object) => {
        if (object.isMesh && object.material && object.material.color && object.userData.chapterColor) {
          object.material.color.lerp(chapterTarget.current, 1 - Math.exp(-delta * 1.5))
        }
      })
    }

    if (sculpture.current) {
      const targetScale = 1 + Math.max(0, progress - 0.28) * 0.48 - Math.max(0, progress - 0.82) * 0.12
      sculpture.current.scale.setScalar(THREE.MathUtils.damp(sculpture.current.scale.x, targetScale, 3, delta))
      sculpture.current.position.x = 1.3 + Math.sin(pageProgress * Math.PI * 2) * 0.12
      sculpture.current.position.z = Math.sin(pageProgress * Math.PI * 4) * 0.08
      if (!reducedMotion) {
        sculpture.current.rotation.y = progress * Math.PI * 1.12 + pageProgress * 0.22 + time * 0.055
        sculpture.current.rotation.x = THREE.MathUtils.damp(
          sculpture.current.rotation.x,
          state.pointer.y * 0.12 + Math.sin(time * 0.2) * 0.035 + Math.sin(pageProgress * Math.PI * 2) * 0.035,
          2,
          delta,
        )
        sculpture.current.rotation.z = THREE.MathUtils.damp(sculpture.current.rotation.z, -state.pointer.x * 0.1, 2, delta)
        sculpture.current.position.y = Math.sin(time * 0.38) * 0.045
      }

      const separation = THREE.MathUtils.smoothstep(progress, 0.39, 0.74)
      const parts = sculpture.current.children
      if (parts[1]) parts[1].position.x = separation * 0.52
      if (parts[2]) parts[2].position.x = -separation * 0.5
      if (parts[3]) parts[3].position.y = separation * 0.46
      if (parts[4]) parts[4].position.y = -separation * 0.42
      if (parts[5]) parts[5].scale.setScalar(0.12 + separation * 0.22)
    }

    if (orbitGroup.current && !reducedMotion) {
      orbitGroup.current.rotation.y = time * 0.035 + progress * 0.55 + pageProgress * 0.72 + state.pointer.x * 0.06
      orbitGroup.current.rotation.x = Math.cos(time * 0.08) * 0.05 + state.pointer.y * 0.045 + Math.sin(pageProgress * Math.PI * 2) * 0.045
      orbitGroup.current.position.x = 1.3 + Math.sin(pageProgress * Math.PI * 2 + 0.6) * 0.16
      orbitGroup.current.position.z = Math.cos(pageProgress * Math.PI * 2) * 0.1
    }

    if (architecture.current) {
      const detail = THREE.MathUtils.smoothstep(progress, 0.42, 0.82)
      const chapterFocus = 0.55 + Math.cos(chapter * Math.PI * 0.5) * 0.2
      architecture.current.scale.setScalar(0.82 + detail * 0.3 + Math.sin(pageProgress * Math.PI * 2) * 0.025)
      architecture.current.rotation.y = -progress * 0.25 + pageProgress * 0.2
      architecture.current.rotation.x = Math.sin(pageProgress * Math.PI * 2) * 0.04
      architecture.current.position.x = 1.3 + Math.cos(pageProgress * Math.PI * 2) * 0.12
      architecture.current.children.forEach((child, index) => {
        child.material.opacity = (0.1 + detail * 0.28) * chapterFocus
        child.material.transparent = true
        child.position.y = Math.sin(time * 0.18 + index * 0.7) * 0.04 + Math.sin(pageProgress * Math.PI * 2 + index) * 0.045
      })
    }

    if (distantLayer.current && !reducedMotion) {
      distantLayer.current.position.x = Math.sin(pageProgress * Math.PI * 2) * 0.28
      distantLayer.current.position.y = Math.cos(pageProgress * Math.PI * 2) * 0.16
      distantLayer.current.rotation.z = pageProgress * -0.035
    }

    if (gridLayer.current && gridMaterial.current) {
      gridLayer.current.position.x = Math.sin(pageProgress * Math.PI * 2) * -0.38
      gridLayer.current.position.y = Math.cos(pageProgress * Math.PI * 2) * 0.22
      gridLayer.current.rotation.y = pageProgress * 0.04
      gridLayer.current.rotation.z = pageProgress * -0.018
      gridMaterial.current.opacity = 0.055 + Math.sin(pageProgress * Math.PI * 2) ** 2 * 0.035
    }

    if (keyLight.current) {
      keyLight.current.color.copy(chapterTarget.current).lerp(keyLightColor, 0.58)
      keyLight.current.position.x = 2.7 + state.pointer.x * 0.7 + Math.sin(pageProgress * Math.PI * 2) * 0.45
      keyLight.current.position.y = 1.7 + state.pointer.y * 0.55 + Math.cos(pageProgress * Math.PI * 2) * 0.24
      keyLight.current.intensity = 22 + Math.sin(time * 0.4) * 2 + chapter * 0.35
    }

    if (ambient.current) ambient.current.color.copy(chapterTarget.current).lerp(ambientLightColor, 0.35)
    if (world.current && !reducedMotion) {
      world.current.rotation.y = Math.sin(time * 0.035) * 0.025 + pageProgress * 0.035
      world.current.rotation.x = Math.sin(pageProgress * Math.PI * 2) * 0.012
    }
  })

  return (
    <group ref={world}>
      <ambientLight ref={ambient} intensity={0.55} color="#a6b9ff" />
      <hemisphereLight args={['#9cafff', '#090a18', 0.42]} />
      <pointLight ref={keyLight} position={[2.8, 1.8, 3.8]} color="#bdcaff" intensity={22} distance={10} />
      <pointLight position={[-3.4, -1.6, -2.4]} color="#7454ff" intensity={14} distance={8} />
      <pointLight position={[0.5, -3, 1]} color="#318fff" intensity={8} distance={6} />

      <group ref={distantLayer}>
        <points geometry={environmentGeometry}>
          <pointsMaterial vertexColors size={0.012} sizeAttenuation transparent opacity={0.44} depthWrite={false} />
        </points>
      </group>

      <group ref={gridLayer} position={[0, 0, -3.2]}>
        <lineSegments geometry={spatialGridGeometry}>
          <lineBasicMaterial ref={gridMaterial} color="#7387d7" transparent opacity={0.065} depthWrite={false} />
        </lineSegments>
      </group>

      <group ref={sculpture} position={[1.3, 0, 0]} rotation={[0.16, -0.3, 0.04]}>
        <mesh geometry={coreGeometry}>
          <meshPhysicalMaterial
            vertexColors
            metalness={0.78}
            roughness={0.24}
            clearcoat={0.85}
            clearcoatRoughness={0.16}
            iridescence={0.55}
            iridescenceIOR={1.28}
            iridescenceThicknessRange={[140, 420]}
            emissive="#171e74"
            emissiveIntensity={0.22}
            flatShading
          />
        </mesh>
        <mesh scale={1.015}>
          <icosahedronGeometry args={[1.13, 1]} />
          <meshBasicMaterial color="#b4c5ff" wireframe transparent opacity={0.12} />
        </mesh>
        <mesh position={[0.14, 0, 0]} scale={0.44} rotation={[0.3, 0.2, 0]}>
          <octahedronGeometry args={[1, 1]} />
          <meshPhysicalMaterial color="#dce8ff" metalness={0.55} roughness={0.12} emissive="#536fff" emissiveIntensity={0.6} clearcoat={1} />
        </mesh>
        <mesh position={[-0.14, 0, 0]} scale={0.25} rotation={[0.1, 0.4, 0.3]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial color="#b5a6ff" metalness={0.75} roughness={0.2} emissive="#613ecb" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.12, 0]} scale={0.3}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#94d8ff" wireframe transparent opacity={0.68} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#d7efff" />
        </mesh>
      </group>

      <group ref={orbitGroup} position={[1.3, 0, 0]}>
        <mesh geometry={orbitGeometryOne} rotation={[0.34, 0.1, 0.36]}>
          <meshStandardMaterial color="#a6baff" emissive="#455bff" emissiveIntensity={0.45} metalness={0.8} roughness={0.24} />
        </mesh>
        <mesh geometry={orbitGeometryTwo} rotation={[-0.52, -0.2, -0.42]} scale={1.12}>
          <meshStandardMaterial color="#bb8dff" emissive="#6034cc" emissiveIntensity={0.32} metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[1.77, 0.1, 0.52]} rotation={[0.3, 0.6, 0.15]} scale={0.13}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#a8c9ff" emissive="#4c76ff" emissiveIntensity={0.85} metalness={0.65} roughness={0.18} />
        </mesh>
      </group>

      <group ref={architecture} position={[1.3, 0, -0.15]}>
        <mesh position={[-0.8, 0.15, -0.5]} userData={{ chapterColor: true }}>
          <boxGeometry args={[1.2, 0.72, 0.015]} />
          <meshBasicMaterial color="#568cff" wireframe transparent opacity={0.2} />
        </mesh>
        <mesh position={[0.78, -0.2, -0.65]} userData={{ chapterColor: true }}>
          <boxGeometry args={[0.72, 0.92, 0.015]} />
          <meshBasicMaterial color="#9b74ff" wireframe transparent opacity={0.18} />
        </mesh>
        <mesh position={[0, 0.82, -0.7]} userData={{ chapterColor: true }}>
          <boxGeometry args={[1.55, 0.42, 0.015]} />
          <meshBasicMaterial color="#4db9ff" wireframe transparent opacity={0.16} />
        </mesh>
        <mesh position={[0.1, -0.84, -0.76]} userData={{ chapterColor: true }}>
          <boxGeometry args={[1.5, 0.32, 0.015]} />
          <meshBasicMaterial color="#aa7aff" wireframe transparent opacity={0.16} />
        </mesh>
      </group>
    </group>
  )
}

function ExperienceScene({ motionState }) {
  const [webglAvailable] = useState(() => {
    const canvas = document.createElement('canvas')
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
  })
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  if (!webglAvailable) return <SceneFallback />

  return (
    <SceneBoundary>
      <Canvas
        className="environment-canvas"
        camera={{ position: [0, 0, 5.2], fov: 36 }}
        dpr={[0.65, 1.15]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      >
        <ExperienceWorld motionState={motionState} reducedMotion={reducedMotion} />
      </Canvas>
    </SceneBoundary>
  )
}

export default ExperienceScene

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

/* ------------------------------------------------------------------ */
/* Shaders (plain WebGL / GLSL ES 1.0-compatible via three's ShaderMaterial) */
/* ------------------------------------------------------------------ */

const PARTICLE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  uniform float uBoost;
  attribute float aSeed;
  attribute float aSize;
  varying float vAlpha;
  varying float vMix;

  void main() {
    vec3 p = position;
    float t = uTime * 0.05;
    p.x += sin(t * 2.0 + aSeed * 20.0) * 0.25;
    p.y += cos(t * 2.3 + aSeed * 31.0) * 0.2 + uScroll * (aSeed - 0.5) * 1.4;
    // endless flow toward the camera, driven by page scroll
    p.z = mod(position.z + uScroll * 7.0 + uTime * 0.12 + 16.0, 19.0) - 16.0;

    float fade = smoothstep(-16.0, -11.0, p.z) * (1.0 - smoothstep(0.5, 2.8, p.z));
    float twinkle = 0.6 + 0.4 * sin(uTime * 1.5 + aSeed * 50.0);
    vAlpha = fade * twinkle;
    vMix = aSeed;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float size = aSize * uPixelRatio * (1.0 + uBoost * 0.8) * (36.0 / max(0.5, -mv.z));
    gl_PointSize = clamp(size, 1.0, 42.0 * uPixelRatio);
    gl_Position = projectionMatrix * mv;
  }
`

const PARTICLE_FRAGMENT = /* glsl */ `
  uniform float uBoost;
  varying float vAlpha;
  varying float vMix;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 3.0);
    vec3 col = mix(vec3(0.55, 0.70, 1.0), vec3(0.72, 0.55, 1.0), vMix);
    col = mix(col, vec3(1.0), pow(core, 8.0));
    gl_FragColor = vec4(col * (1.0 + uBoost * 0.6), glow * vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const SHELL_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const SHELL_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), uPower);
    f *= 0.86 + 0.14 * sin(vNormal.y * 38.0 + uTime * 1.4);
    float a = clamp(f * uIntensity, 0.0, 1.0);
    gl_FragColor = vec4(uColor * (0.6 + a), a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/* ------------------------------------------------------------------ */
/* Geometry builders                                                   */
/* ------------------------------------------------------------------ */

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

function createParticleGeometry(count) {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  let seed = 97

  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 18
    positions[index * 3 + 1] = (random() - 0.5) * 10
    positions[index * 3 + 2] = 3 - random() * 19
    seeds[index] = random()
    sizes[index] = 0.35 + Math.pow(random(), 3) * 1.6
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  return geometry
}

/* ------------------------------------------------------------------ */
/* Camera choreography: one keyframe per page chapter                  */
/* (#home, #about, .what-we-do, #work, #process, #technology,          */
/*  #principles, #contact) — hero keeps the original composition.      */
/* ------------------------------------------------------------------ */

const CAMERA_KEYS = [
  { x: 0, y: 0, z: 5.2, lx: 0 },
  { x: 0.35, y: 0.1, z: 4.7, lx: 0.2 },
  { x: -0.2, y: -0.1, z: 5.6, lx: 0.9 },
  { x: 0.6, y: 0.15, z: 4.4, lx: -0.2 },
  { x: -0.5, y: -0.1, z: 4.9, lx: 0.5 },
  { x: 0.2, y: 0.2, z: 4.3, lx: -0.1 },
  { x: -0.3, y: 0, z: 5.0, lx: 0.4 },
  { x: 0, y: 0, z: 4.0, lx: 0.8 },
]

const RING_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const smooth = (t) => t * t * (3 - 2 * t)

/* Lowers render resolution if the device can't hold ~30fps. */
function PerfGuard() {
  const stats = useRef({ time: 0, frames: 0, warm: 0, level: 0 })

  useFrame((state, delta) => {
    const s = stats.current
    s.warm += 1
    if (s.warm < 150) return // ignore shader-compile hitches
    s.time += delta
    s.frames += 1
    if (s.frames >= 90) {
      const average = s.time / s.frames
      s.time = 0
      s.frames = 0
      if (average > 0.033 && s.level < 2) {
        s.level += 1
        state.setDpr(s.level === 1 ? 0.8 : 0.6)
      }
    }
  })

  return null
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
  const tunnel = useRef(null)
  const particleMaterial = useRef(null)
  const shellMaterial = useRef(null)
  const lookTarget = useRef(null)
  const elapsed = useRef(0)
  const coreGeometry = useMemo(() => createCoreGeometry(), [])
  const orbitGeometryOne = useMemo(() => createOrbitGeometry(0.3), [])
  const orbitGeometryTwo = useMemo(() => createOrbitGeometry(2.2), [])
  const environmentGeometry = useMemo(() => createEnvironmentGeometry(), [])
  const spatialGridGeometry = useMemo(() => createSpatialGridGeometry(), [])
  const ringGeometry = useMemo(() => new THREE.TorusGeometry(1, 0.0045, 6, 160), [])
  const particleCount = useMemo(() => (window.innerWidth < 760 ? 900 : 2400), [])
  const particleGeometry = useMemo(() => createParticleGeometry(particleCount), [particleCount])
  const particleUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPixelRatio: { value: 1 },
    uBoost: { value: 0 },
  }), [])
  const shellUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color('#7fa6ff') },
    uIntensity: { value: 1 },
    uPower: { value: 2.6 },
    uTime: { value: 0 },
  }), [])
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
  const glowColor = useRef(new THREE.Color('#7fa6ff'))
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

    // A pulse of light each time a new chapter settles into place (not on the hero at rest).
    const chapterEdge = Math.abs(currentChapter.current - Math.round(currentChapter.current))
    const chapterPulse = reducedMotion
      ? 0
      : THREE.MathUtils.smoothstep(currentChapter.current, 0.15, 0.7) * Math.max(0, 1 - chapterEdge * 3.2)

    /* ---------------- camera rig ---------------- */
    {
      const camera = state.camera
      const last = CAMERA_KEYS.length - 1
      const lo = Math.min(last, Math.floor(currentChapter.current))
      const hi = Math.min(last, lo + 1)
      const blend = smooth(Math.min(1, Math.max(0, currentChapter.current - lo)))
      const a = CAMERA_KEYS[lo]
      const b = CAMERA_KEYS[hi]
      const narrow = state.size.width < 760
      const pointerAmount = reducedMotion ? 0 : 1
      const heroDolly = Math.sin(Math.min(1, progress) * Math.PI) * 0.55
      const narrowPullback = narrow ? 1.1 * Math.min(1, currentChapter.current) : 0
      const targetX = THREE.MathUtils.lerp(a.x, b.x, blend) + state.pointer.x * 0.32 * pointerAmount
      const targetY = THREE.MathUtils.lerp(a.y, b.y, blend) + state.pointer.y * 0.18 * pointerAmount
      const targetZ = THREE.MathUtils.lerp(a.z, b.z, blend) - heroDolly + narrowPullback
      const targetLookX = THREE.MathUtils.lerp(a.lx, b.lx, blend)

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.2, delta)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.2, delta)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.2, delta)
      if (!lookTarget.current) lookTarget.current = new THREE.Vector3()
      lookTarget.current.x = THREE.MathUtils.damp(lookTarget.current.x, narrow ? targetLookX * 0.4 : targetLookX, 2.2, delta)
      lookTarget.current.y = THREE.MathUtils.damp(lookTarget.current.y, state.pointer.y * 0.1 * pointerAmount, 2.2, delta)
      camera.lookAt(lookTarget.current)
    }

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

    /* ---------------- glow layers ---------------- */
    if (particleMaterial.current) {
      const uniforms = particleMaterial.current.uniforms
      uniforms.uTime.value = time
      uniforms.uScroll.value = pageProgress
      uniforms.uPixelRatio.value = state.gl.getPixelRatio()
      uniforms.uBoost.value = chapterPulse * 0.9 + Math.sin(Math.min(1, progress) * Math.PI) * 0.35
    }

    if (shellMaterial.current) {
      const uniforms = shellMaterial.current.uniforms
      glowColor.current.copy(chapterTarget.current).offsetHSL(0, 0.35, 0.34)
      uniforms.uColor.value.copy(glowColor.current)
      uniforms.uTime.value = time
      uniforms.uIntensity.value = 0.9 + chapterPulse * 0.8 + Math.sin(time * 0.6) * 0.08 + Math.sin(Math.min(1, progress) * Math.PI) * 0.35
    }

    if (tunnel.current) {
      const flow = reducedMotion ? 0 : pageProgress * 20 + time * 0.18
      const span = 15
      tunnel.current.children.forEach((ring, index) => {
        let z = (-index * 1.5 + flow) % span
        if (z < 0) z += span
        z = z - span + 1.5
        const fade = THREE.MathUtils.smoothstep(z, -13.5, -9) * (1 - THREE.MathUtils.smoothstep(z, -0.5, 1.5))
        const direction = index % 2 === 0 ? -1 : 1
        ring.position.z = z
        ring.rotation.z = index * 0.7 + time * 0.03 * direction + pageProgress * direction * 0.8
        ring.material.opacity = (0.16 + chapterPulse * 0.22) * fade
      })
    }

    if (keyLight.current) {
      keyLight.current.color.copy(chapterTarget.current).lerp(keyLightColor, 0.58)
      keyLight.current.position.x = 2.7 + state.pointer.x * 0.7 + Math.sin(pageProgress * Math.PI * 2) * 0.45
      keyLight.current.position.y = 1.7 + state.pointer.y * 0.55 + Math.cos(pageProgress * Math.PI * 2) * 0.24
      keyLight.current.intensity = 22 + Math.sin(time * 0.4) * 2 + chapter * 0.35 + chapterPulse * 10
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

      {/* Glowing shader particles that stream past the camera as you scroll */}
      <points geometry={particleGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={particleMaterial}
          uniforms={particleUniforms}
          vertexShader={PARTICLE_VERTEX}
          fragmentShader={PARTICLE_FRAGMENT}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Ring tunnel: gives the camera movement real parallax depth */}
      <group ref={tunnel} position={[1.1, 0, 0]}>
        {RING_INDEXES.map((index) => (
          <mesh key={index} geometry={ringGeometry} scale={2.2 + index * 0.32} rotation={[0, 0, index * 0.7]}>
            <meshBasicMaterial
              color={index % 3 === 0 ? '#a58bff' : '#6f93ff'}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
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
        {/* Fresnel rim-glow shell. Kept as the LAST child so the indexed part animation above is unaffected. */}
        <mesh scale={1.16}>
          <icosahedronGeometry args={[1.13, 4]} />
          <shaderMaterial
            ref={shellMaterial}
            uniforms={shellUniforms}
            vertexShader={SHELL_VERTEX}
            fragmentShader={SHELL_FRAGMENT}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
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
        dpr={[0.75, 1.5]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      >
        <ExperienceWorld motionState={motionState} reducedMotion={reducedMotion} />
        <PerfGuard />
      </Canvas>
    </SceneBoundary>
  )
}

export default ExperienceScene

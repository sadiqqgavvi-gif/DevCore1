import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { capabilities } from '../data.js'

// Chapter 05: the capabilities as cards on a ribbon winding through depth. Scroll rides the camera
// along it, pausing a little at each card. Every card is one instance of one mesh sampling one
// atlas, so the whole ribbon costs a single draw call.
const COLORS = ['#e8483a', '#f08a2c', '#f2c94c', '#4bb36b', '#3d7be0', '#7a5cd6']
const CARD_W = 3
const CARD_H = 2
const FOV = 50
// Cards exist on either side of the ride, so the ribbon always has somewhere to come from and go.
const FIRST = -2
const LAST = capabilities.length + 2
const RIDE = capabilities.length - 1
const STEP_Z = 5.2

const COLS = 3
const ROWS = 2
const CELL_W = 512
const CELL_H = Math.round((CELL_W * CARD_H) / CARD_W)

const scratch = new THREE.Object3D()
const lookTarget = new THREE.Vector3()
const nextCard = new THREE.Vector3()

// The ribbon's centre line, in card units: cards sit at whole numbers. Tall screens get a tighter
// swing (`sway`), so the card in front is never pushed off the sides.
function centre(u, out, sway) {
  return out.set(3.2 * sway * Math.sin(u * 0.95), 1.4 * Math.sin(u * 1.6 + 0.6), -u * STEP_Z)
}

function wrapLines(ctx, text, width) {
  const lines = ['']
  text.split(' ').forEach((word) => {
    const line = `${lines[lines.length - 1]} ${word}`.trim()
    if (ctx.measureText(line).width <= width || !lines[lines.length - 1]) lines[lines.length - 1] = line
    else lines.push(word)
  })
  return lines
}

function drawCard(ctx, index, art) {
  const x = (index % COLS) * CELL_W
  const y = Math.floor(index / COLS) * CELL_H
  const color = COLORS[index % COLORS.length]
  const titleFont = getComputedStyle(document.querySelector('.cap__title')).fontFamily
  const numFont = getComputedStyle(document.querySelector('.cap__num')).fontFamily
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, CELL_W, CELL_H)
  ctx.clip()
  const paper = ctx.createLinearGradient(x, y, x, y + CELL_H)
  paper.addColorStop(0, '#231a2a')
  paper.addColorStop(1, '#0c0a10')
  ctx.fillStyle = paper
  ctx.fillRect(x, y, CELL_W, CELL_H)
  const glow = ctx.createRadialGradient(x + CELL_W * 0.78, y + CELL_H * 0.3, 0, x + CELL_W * 0.78, y + CELL_H * 0.3, CELL_W * 0.55)
  glow.addColorStop(0, `${color}55`)
  glow.addColorStop(1, `${color}00`)
  ctx.fillStyle = glow
  ctx.fillRect(x, y, CELL_W, CELL_H)
  ctx.fillStyle = color
  ctx.fillRect(x, y, CELL_W, 10)
  if (art) ctx.drawImage(art, x + CELL_W - 190, y + 34, 160, 128)
  ctx.fillStyle = color
  ctx.font = `30px ${numFont}`
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`0${index + 1}`, x + 32, y + 66)
  ctx.fillStyle = '#fcf9f3'
  ctx.font = `500 44px ${titleFont}`
  const lines = wrapLines(ctx, capabilities[index].title, CELL_W - 64)
  lines.forEach((line, row) => ctx.fillText(line, x + 32, y + CELL_H - 34 - (lines.length - 1 - row) * 48))
  ctx.restore()
}

// The drawings already on the page become the cards' art, in each card's own colour.
function loadArt(type, color) {
  const source = document.querySelector(`.cap-art--${type}`)
  if (!source) return Promise.resolve(null)
  const clone = source.cloneNode(true)
  clone.removeAttribute('style')
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', 320)
  clone.setAttribute('height', 256)
  clone.setAttribute('color', color)
  const image = new Image()
  image.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`
  return image.decode().then(() => image).catch(() => null)
}

const VERTEX = /* glsl */`
  attribute vec2 cell;
  attribute float place;
  uniform float focus;
  uniform float reach;
  varying vec2 vAtlas;
  varying vec2 vCard;
  varying float vFade;
  varying float vLight;
  void main() {
    vCard = uv;
    vAtlas = (cell + vec2(uv.x, 1.0 - uv.y) * 0.98 + 0.01) / vec2(${COLS}.0, ${ROWS}.0);
    vAtlas.y = 1.0 - vAtlas.y;
    vec4 view = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    float dist = -view.z;
    // Cards dissolve into the distance, and clear the view before the camera reaches them.
    vFade = smoothstep(reach + 18.0, reach + 7.0, dist) * smoothstep(reach * 0.6, reach * 0.95, dist);
    vLight = 1.0 - 0.5 * clamp(abs(place - focus) - 0.15, 0.0, 1.0);
    gl_Position = projectionMatrix * view;
  }
`

const FRAGMENT = /* glsl */`
  uniform sampler2D map;
  varying vec2 vAtlas;
  varying vec2 vCard;
  varying float vFade;
  varying float vLight;
  void main() {
    vec2 p = (vCard - 0.5) * vec2(${(CARD_W / CARD_H).toFixed(3)}, 1.0);
    vec2 corner = abs(p) - vec2(${(CARD_W / CARD_H / 2).toFixed(3)} - 0.06, 0.44);
    float edge = length(max(corner, 0.0)) - 0.06;
    float shape = 1.0 - smoothstep(-0.004, 0.004, edge);
    vec3 rim = vec3(0.1) * smoothstep(-0.012, -0.004, edge);
    gl_FragColor = vec4(texture2D(map, vAtlas).rgb * vLight + rim, shape * vFade);
    #include <colorspace_fragment>
  }
`

function Ribbon({ progressRef, onFocus }) {
  const meshRef = useRef(null)
  const ride = useRef(null)
  const shown = useRef(0)
  const sway = useThree((state) => (state.viewport.aspect >= 1 ? 1 : 0.32))

  const resources = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CELL_W * COLS
    canvas.height = CELL_H * ROWS
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    const uniforms = { focus: { value: 0 }, reach: { value: 5 }, map: { value: texture } }

    const places = []
    for (let u = LAST; u >= FIRST; u -= 1) places.push(u)
    // Drawn far to near, so the cards blend over each other correctly along the whole ride.
    const count = places.length
    const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H)
    const cells = new Float32Array(count * 2)
    const placed = new Float32Array(count)
    places.forEach((u, index) => {
      const card = ((u % capabilities.length) + capabilities.length) % capabilities.length
      cells[index * 2] = card % COLS
      cells[index * 2 + 1] = Math.floor(card / COLS)
      placed[index] = u
    })
    geometry.setAttribute('cell', new THREE.InstancedBufferAttribute(cells, 2))
    geometry.setAttribute('place', new THREE.InstancedBufferAttribute(placed, 1))

    const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide })

    const points = []
    for (let u = FIRST - 1; u <= LAST + 1; u += 0.25) points.push(centre(u, new THREE.Vector3(), sway))
    const thread = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 240, 0.009, 6, false)
    const threadMaterial = new THREE.MeshBasicMaterial({ color: '#ffb36b', transparent: true, opacity: 0.3, depthWrite: false, depthTest: false, toneMapped: false })
    return { canvas, texture, places, count, geometry, material, thread, threadMaterial }
  }, [sway])

  useEffect(() => {
    const { canvas, texture } = resources
    const ctx = canvas.getContext('2d')
    let live = true
    const paint = (arts = []) => {
      capabilities.forEach((_, index) => drawCard(ctx, index, arts[index]))
      texture.needsUpdate = true
    }
    paint()
    document.fonts.ready
      .then(() => Promise.all(capabilities.map((cap, index) => loadArt(cap.art, COLORS[index]))))
      .then((arts) => { if (live) paint(arts) })
    return () => {
      live = false
      texture.dispose()
      resources.geometry.dispose()
      resources.material.dispose()
      resources.thread.dispose()
      resources.threadMaterial.dispose()
    }
  }, [resources])

  useFrame(({ camera, pointer, clock, viewport }, delta) => {
    // A small pause at each card: progress eases through the middle of each step.
    const position = Math.min(1, Math.max(0, progressRef.current)) * RIDE
    const base = Math.min(RIDE - 1, Math.floor(position))
    const frac = position - base
    const target = base + frac + (frac * frac * (3 - 2 * frac) - frac) * 0.7
    // Slow catch-up, so a flick glides instead of jumping (the first frame goes straight there).
    ride.current = ride.current === null ? target : THREE.MathUtils.damp(ride.current, target, 2.4, Math.min(delta, 0.1))
    const u = ride.current

    // Far enough back that the card fits across the screen, however narrow it is.
    const reach = Math.max(4.4, (CARD_W * 1.28) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * viewport.aspect))
    centre(u, lookTarget, sway)
    camera.position.set(lookTarget.x * 0.6 + pointer.x * 0.25, lookTarget.y * 0.6 + 0.1 + pointer.y * 0.15, lookTarget.z + reach)
    centre(u + 1, nextCard, sway)
    camera.lookAt(lookTarget.lerp(nextCard, 0.1))
    camera.rotateZ(Math.sin(u * 1.1) * 0.05 + Math.sin(clock.elapsedTime * 0.4) * 0.006)

    const { uniforms } = meshRef.current.material
    uniforms.focus.value = u
    uniforms.reach.value = reach
    const card = Math.max(0, Math.min(RIDE, Math.round(u)))
    if (card !== shown.current) {
      shown.current = card
      onFocus?.(card)
    }
  })

  const setMatrices = (mesh) => {
    meshRef.current = mesh
    if (!mesh) return
    resources.places.forEach((u, index) => {
      centre(u, scratch.position, sway)
      // Each card turns to face the camera's stop for it, then leans along the ribbon.
      scratch.lookAt(scratch.position.x * 0.6, scratch.position.y * 0.6, scratch.position.z + 5)
      scratch.rotateZ(Math.sin(u * 2.1) * 0.08)
      scratch.updateMatrix()
      mesh.setMatrixAt(index, scratch.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }

  return (
    <>
      <mesh geometry={resources.thread} material={resources.threadMaterial} renderOrder={0} />
      <instancedMesh ref={setMatrices} args={[resources.geometry, resources.material, resources.count]} renderOrder={1} frustumCulled={false} />
    </>
  )
}

export default function RibbonScene({ active, progressRef, onFocus }) {
  const mobile = window.innerWidth < 760
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, mobile ? 1.5 : 1.75]}
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 0, 6] }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
    >
      <Ribbon progressRef={progressRef} onFocus={onFocus} />
    </Canvas>
  )
}

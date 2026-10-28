// Shared motion contract for the page: scroll state, camera keyframes, stage layout and
// motion tokens. Kept free of React/Three imports so any module can use it cheaply.

export const EASE = {
  reveal: 'power3.out',
  settle: 'power2.out',
  travel: 'power2.inOut',
  scrub: 'none',
}

export const DURATION = {
  reveal: 0.9,
  settle: 0.55,
}

// One selector per narrative chapter, in page order. The index in this list is the chapter
// number used by the camera rig and the scene colour grading.
export const CHAPTER_SELECTORS = [
  '#home',
  '#about',
  '.what-we-do',
  '#work',
  '#process',
  '#technology',
  '#principles',
  '#contact',
]

export function createMotionState() {
  return {
    progress: 0, // hero story progress, 0..1 (written by Hero)
    pageProgress: 0, // whole-page scroll progress, 0..1
    chapter: 0, // fractional chapter index, 0..CHAPTER_SELECTORS.length - 1
    pointerTarget: { x: 0, y: 0 }, // raw pointer, -1..1 (written by SceneBackground; consumers smooth it locally)
  }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const lerp = (a, b, t) => a + (b - a) * t
const smooth = (t) => t * t * (3 - 2 * t)

// Camera keyframes per chapter: [x, y, z, lookX, lookY]
export const BASE_CAMERA_Z = 5.2
export const CAMERA_KEYS = [
  [0, 0, BASE_CAMERA_Z, 0, 0], // 00 hero
  [-0.45, 0.14, 6.0, 0.55, 0], // 01 studio: pull back, drift the object left
  [0.1, 0.35, 6.7, 0.5, 0.05], // 02 services: widest, orbit reads fully
  [0.9, -0.12, 5.7, 0.7, 0], // 03 work: lateral track
  [-0.7, -0.3, 5.4, 0.9, 0], // 04 process: low, travelling
  [0.5, 0.25, 6.3, 0.6, 0.05], // 05 toolkit: high and wide
  [-0.3, 0.05, 5.6, 0.8, 0], // 06 principles: settle
  [0, 0, 4.7, 0.4, 0], // 07 contact: close, facing the viewer
]

// Writes the interpolated keyframe for a fractional chapter into `out`.
export function sampleCamera(chapter, out) {
  const last = CAMERA_KEYS.length - 1
  const position = clamp(chapter, 0, last)
  const low = Math.floor(position)
  const high = Math.min(last, low + 1)
  const t = smooth(position - low)
  for (let index = 0; index < 5; index += 1) {
    out[index] = lerp(CAMERA_KEYS[low][index], CAMERA_KEYS[high][index], t)
  }
  return out
}

// Where the sculpture sits on screen. The hero sculpture lives at x = STAGE_ANCHOR_X in its
// own local space; the stage group is positioned/scaled so that point lands on the anchor
// returned here, which keeps it fully in frame on any aspect ratio.
export const STAGE_ANCHOR_X = 1.3
const HALF_FOV_TAN = Math.tan((36 / 2) * (Math.PI / 180))

export function getStageLayout(aspect, out = {}) {
  const t = smooth(clamp((aspect - 0.5) / 1.1, 0, 1)) // 0 = tall phone, 1 = wide screen
  const halfHeight = BASE_CAMERA_Z * HALF_FOV_TAN
  const halfWidth = halfHeight * aspect
  out.scale = lerp(0.5, 1, t)
  out.anchorX = Math.min(1.35, halfWidth * lerp(0.12, 0.43, t))
  out.anchorY = -halfHeight * lerp(0.4, 0, t)
  out.lateral = lerp(0.4, 1, t) // how much camera travel is applied (phones travel less)
  return out
}

// Phones and low-memory devices get a lighter render (fewer particles, simpler materials,
// lower pixel ratio) while keeping the same scene and motion.
export function getRenderTier() {
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 600
  const memory = navigator.deviceMemory
  return narrow || (memory !== undefined && memory <= 4) ? 'lite' : 'full'
}

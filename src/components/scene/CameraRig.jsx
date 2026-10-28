import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BASE_CAMERA_Z, getStageLayout, sampleCamera } from '../../lib/motion.js'

// Scroll-linked camera. Reads the shared motion state, samples the chapter keyframes and
// damps the camera toward them. Reads the shared state only; all smoothing lives in local refs.
export default function CameraRig({ motionState, reducedMotion }) {
  const keyframe = useRef([0, 0, BASE_CAMERA_Z, 0, 0])
  const layout = useRef({ scale: 1, anchorX: 0, anchorY: 0, lateral: 1 })
  const look = useRef(new THREE.Vector3())
  const pointer = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const { camera, size } = state
    const motion = motionState.current
    const damp = THREE.MathUtils.damp

    pointer.current.x = damp(pointer.current.x, reducedMotion ? 0 : motion.pointerTarget.x, 3.2, delta)
    pointer.current.y = damp(pointer.current.y, reducedMotion ? 0 : motion.pointerTarget.y, 3.2, delta)

    const { lateral } = getStageLayout(size.width / Math.max(1, size.height), layout.current)
    const key = sampleCamera(reducedMotion ? 0 : motion.chapter, keyframe.current)

    // Push in during the hero story, then release as the hero hands over to the next chapter.
    const push = reducedMotion ? 0 : Math.sin(motion.progress * Math.PI) * 0.45
    const targetX = key[0] * lateral + pointer.current.x * 0.14 * lateral
    const targetY = key[1] * lateral + pointer.current.y * 0.09 * lateral
    const targetZ = BASE_CAMERA_Z + (key[2] - BASE_CAMERA_Z) * lateral - push
    const lookX = key[3] * lateral
    const lookY = key[4] * lateral

    const rate = reducedMotion ? 1000 : 3.4
    camera.position.x = damp(camera.position.x, targetX, rate, delta)
    camera.position.y = damp(camera.position.y, targetY, rate, delta)
    camera.position.z = damp(camera.position.z, targetZ, rate, delta)
    look.current.x = damp(look.current.x, lookX, rate, delta)
    look.current.y = damp(look.current.y, lookY, rate, delta)
    camera.lookAt(look.current)
  })

  return null
}

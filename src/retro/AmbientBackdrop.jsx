import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { SceneBoundary } from './scenes/SceneMount.jsx'
import { detectWebGL } from './scenes/webgl.js'

const AmbientWorld = lazy(() => import('./scenes/AmbientWorld.jsx'))

// Chapters drawn over the shared world, in the order of its z anchors.
const ZONES = ['studio', 'services', 'technology', 'process']

// Fixed backdrop behind the five "environment" chapters. It mounts the WebGL world lazily,
// renders only while one of those chapters is on screen, and is skipped entirely for reduced
// motion or missing WebGL — the chapters then fall back to their CSS backgrounds.
export default function AmbientBackdrop({ reducedMotion }) {
  const stateRef = useRef({ progress: ZONES.map(() => 0) })
  const [supported] = useState(detectWebGL)
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const enabled = supported && !reducedMotion

  // Chapters only turn transparent once the renderer really exists.
  useEffect(() => {
    document.documentElement.classList.toggle('has-ambient', enabled && ready)
    return () => document.documentElement.classList.remove('has-ambient')
  }, [enabled, ready])

  useEffect(() => {
    if (!enabled) return undefined
    const sections = ZONES.map((id) => document.getElementById(id)).filter(Boolean)
    const showing = new Set()
    const nearObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setNear(true)
        nearObserver.disconnect()
      }
    }, { rootMargin: '100% 0px' })
    const visibleObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? showing.add(entry.target) : showing.delete(entry.target)))
      setVisible(showing.size > 0)
    })
    sections.forEach((section) => {
      nearObserver.observe(section)
      visibleObserver.observe(section)
    })
    return () => {
      nearObserver.disconnect()
      visibleObserver.disconnect()
    }
  }, [enabled])

  // Progress of each chapter through the viewport (0 = top edge entering from below, 1 = bottom
  // edge leaving the top), read by the camera rig on frames it actually renders. A pinned chapter
  // is measured by its pin-spacer, so the pinned stretch counts as part of the chapter.
  useEffect(() => {
    stateRef.current.measure = () => {
      const { progress } = stateRef.current
      const vh = window.innerHeight
      ZONES.forEach((id, index) => {
        const section = document.getElementById(id)
        if (!section) return
        const host = section.parentElement?.classList.contains('pin-spacer') ? section.parentElement : section
        const rect = host.getBoundingClientRect()
        progress[index] = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)))
      })
    }
  }, [])

  return (
    <div className={`ambient ${visible ? 'is-on' : ''}`} aria-hidden="true">
      {enabled && near && (
        <SceneBoundary fallback={null}>
          <Suspense fallback={null}>
            <AmbientWorld active={visible} stateRef={stateRef} onReady={() => setReady(true)} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  )
}

import { lazy, Suspense, useEffect, useState } from 'react'
import { ScrollTrigger } from '../../lib/gsap.js'

const HeroScene = lazy(() => import('../HeroScene.jsx'))
const sectionSelectors = [
  '#home',
  '#about',
  '.what-we-do',
  '#work',
  '#process',
  '#technology',
  '#principles',
  '#contact',
]

function ScenePlaceholder() {
  return (
    <div className="environment-fallback" aria-hidden="true">
      <div className="environment-fallback-orbit environment-fallback-orbit-one" />
      <div className="environment-fallback-orbit environment-fallback-orbit-two" />
      <div className="environment-fallback-core"><span /></div>
    </div>
  )
}

export default function SceneBackground({ motionState, rootRef }) {
  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSceneReady(true), 250)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const sections = sectionSelectors
      .map((selector) => root.querySelector(selector))
      .filter(Boolean)
    let disposed = false
    let sectionStarts = []
    let frame = 0
    const measureSections = () => {
      sectionStarts = sections.map((section) => section.getBoundingClientRect().top + window.scrollY)
      updatePageProgress()
    }

    const updatePageProgress = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight
        motionState.current.pageProgress = scrollableDistance > 0
          ? Math.min(1, Math.max(0, scrollY / scrollableDistance))
          : 0

        let chapter = 0
        for (let index = 0; index < sectionStarts.length - 1; index += 1) {
          const start = sectionStarts[index]
          const end = sectionStarts[index + 1]
          if (scrollY < end) {
            chapter = index + (end > start ? (scrollY - start) / (end - start) : 0)
            break
          }
          chapter = index + 1
        }
        motionState.current.chapter = sectionStarts.length
          ? Math.min(sectionStarts.length - 1, Math.max(0, chapter))
          : 0
        frame = 0
      })
    }

    updatePageProgress()
    window.addEventListener('scroll', updatePageProgress, { passive: true })
    window.addEventListener('resize', measureSections)
    ScrollTrigger.addEventListener('refresh', measureSections)
    const measureFrame = window.requestAnimationFrame(measureSections)
    document.fonts.ready.then(() => {
      if (!disposed) measureSections()
    })

    return () => {
      disposed = true
      window.removeEventListener('scroll', updatePageProgress)
      window.removeEventListener('resize', measureSections)
      ScrollTrigger.removeEventListener('refresh', measureSections)
      window.cancelAnimationFrame(measureFrame)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [motionState, rootRef])

  return (
    <div className="environment-host" aria-hidden="true">
      {sceneReady
        ? <Suspense fallback={<ScenePlaceholder />}><HeroScene motionState={motionState} /></Suspense>
        : <ScenePlaceholder />}
    </div>
  )
}

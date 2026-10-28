import { lazy, Suspense, useEffect, useState } from 'react'

const LusionScene = lazy(() => import('./LusionScene.jsx'))

function ScenePlaceholder() {
  return (
    <div className="environment-fallback" aria-hidden="true">
      <div className="environment-fallback-orbit environment-fallback-orbit-one" />
      <div className="environment-fallback-orbit environment-fallback-orbit-two" />
      <div className="environment-fallback-core"><span /></div>
    </div>
  )
}

export default function SceneBackground({ motionState }) {
  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSceneReady(true), 250)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let frame = 0
    const update = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        motionState.current.pageProgress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
        frame = 0
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [motionState])

  return (
    <div className="environment-host" aria-hidden="true">
      {sceneReady
        ? <Suspense fallback={<ScenePlaceholder />}><LusionScene motionState={motionState} /></Suspense>
        : <ScenePlaceholder />}
    </div>
  )
}

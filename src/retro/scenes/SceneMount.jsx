import { Component, Suspense, useEffect, useRef, useState } from 'react'
import { detectWebGL } from './webgl.js'

export class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('[DevCore] 3D scene unavailable, showing fallback.', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

// Mounts a (lazy) WebGL scene only once it is near the viewport, tells it when it is actually
// visible so it can stop rendering off-screen, and falls back to static artwork when WebGL is
// missing or the scene throws.
export default function SceneMount({ scene: Scene, fallback, className = '', ...sceneProps }) {
  const ref = useRef(null)
  const [supported] = useState(detectWebGL)
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    const nearObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setNear(true)
      nearObserver.disconnect()
    }, { rootMargin: '80% 0px' })
    const visibleObserver = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '10% 0px' })
    nearObserver.observe(element)
    visibleObserver.observe(element)
    return () => {
      nearObserver.disconnect()
      visibleObserver.disconnect()
    }
  }, [])

  return (
    <div className={`scene-mount ${className}`} ref={ref}>
      {supported && near ? (
        <SceneBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <Scene active={visible} {...sceneProps} />
          </Suspense>
        </SceneBoundary>
      ) : fallback}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import CustomCursor from './components/layout/CustomCursor.jsx'
import Navigation from './components/layout/Navigation.jsx'
import SceneBackground from './components/backgrounds/SceneBackground.jsx'
import Contact from './sections/Contact/Contact.jsx'
import { Hero, Statement, Work, Capabilities, Manifesto, Closing, SiteFooter } from './sections/Lusion/Sections.jsx'
import { ScrollTrigger } from './lib/gsap.js'
import { usePageMotion } from './hooks/usePageMotion.js'
import './App.css'
import './styles/lusion.css'

export default function App() {
  const rootRef = useRef(null)
  const motionState = useRef({ progress: 0, pageProgress: 0, active: true })
  usePageMotion(rootRef)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return undefined
    let disposed = false
    let frame = 0
    document.fonts.ready.then(() => {
      frame = window.requestAnimationFrame(() => {
        const target = document.getElementById(hash)
        if (disposed || !target) return
        ScrollTrigger.refresh()
        const root = document.documentElement
        const previous = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto'
        window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY)
        root.style.scrollBehavior = previous
      })
    })
    return () => { disposed = true; window.cancelAnimationFrame(frame) }
  }, [])

  return (
    <div className="site-shell lx" ref={rootRef}>
      <a className="lx-skip" href="#main">Skip to content</a>
      <SceneBackground motionState={motionState} />
      <CustomCursor rootRef={rootRef} />
      <Navigation />
      <main id="main" tabIndex={-1}>
        <Hero motionState={motionState} />
        <Statement />
        <Work />
        <Capabilities />
        <Manifesto />
        <Closing />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  )
}

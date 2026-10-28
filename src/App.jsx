import { useEffect, useRef } from 'react'
import CustomCursor from './components/layout/CustomCursor.jsx'
import Footer from './components/layout/Footer.jsx'
import Navigation from './components/layout/Navigation.jsx'
import ChapterTransitions from './components/backgrounds/ChapterTransitions.jsx'
import SceneBackground from './components/backgrounds/SceneBackground.jsx'
import Marquee from './components/ui/Marquee.jsx'
import About from './sections/About/About.jsx'
import Contact from './sections/Contact/Contact.jsx'
import Hero from './sections/Hero/Hero.jsx'
import HowWeWork from './sections/HowWeWork/HowWeWork.jsx'
import Portfolio from './sections/Portfolio/Portfolio.jsx'
import Principles from './sections/Principles/Principles.jsx'
import Statement from './sections/Statement/Statement.jsx'
import Technology from './sections/Technology/Technology.jsx'
import WhatWeDo from './sections/WhatWeDo/WhatWeDo.jsx'
import { ScrollTrigger } from './lib/gsap.js'
import { useCinematicMotion } from './hooks/useCinematicMotion.js'
import { usePageMotion } from './hooks/usePageMotion.js'
import './App.css'
import './styles/cinematic.css'

export default function App() {
  const rootRef = useRef(null)
  const motionState = useRef({ progress: 0, pageProgress: 0, chapter: 0 })
  usePageMotion(rootRef)
  useCinematicMotion(rootRef)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return undefined

    let disposed = false
    let firstFrame = 0
    let secondFrame = 0
    document.fonts.ready.then(() => {
      if (disposed) return
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (disposed) return
          const target = document.getElementById(hash)
          if (!target) return

          ScrollTrigger.refresh()
          const previousScrollBehavior = document.documentElement.style.scrollBehavior
          document.documentElement.style.scrollBehavior = 'auto'
          window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY)
          document.documentElement.style.scrollBehavior = previousScrollBehavior
          ScrollTrigger.update()
        })
      })
    })

    return () => {
      disposed = true
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [])

  return (
    <div className="site-shell" ref={rootRef}>
      <SceneBackground motionState={motionState} rootRef={rootRef} />
      <ChapterTransitions rootRef={rootRef} />
      <CustomCursor rootRef={rootRef} />
      <Navigation />
      <main>
        <Hero motionState={motionState} />
        <Marquee />
        <About />
        <WhatWeDo />
        <Portfolio />
        <Statement />
        <HowWeWork />
        <Technology />
        <Principles />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { requestScrollRefresh, ScrollTrigger } from '../lib/gsap.js'
import AmbientBackdrop from './AmbientBackdrop.jsx'
import { alreadyBooted } from './boot.js'
import { chapters } from './data.js'
import { ProcessFlow } from './ProcessFlow.jsx'
import { Assembler, Capabilities, CaseFiles, Lab, Prelude, Quality } from './RetroChapters.jsx'
import { BootScreen, ChapterIndicator, CrtOverlay, Navigation, Toast } from './RetroChrome.jsx'
import { Gazette } from './Gazette.jsx'
import { AboutZoom, Convinced, StartProject } from './RetroSections.jsx'
import SkylineHero from './SkylineHero.jsx'
import './retro.css'
import './retro-chapters.css'
import './retro-depth.css'
import './skyline-hero.css'
import './closing.css'
import './gazette.css'
import './process-flow.css'

const TRACKED_SECTIONS = chapters.map(([id]) => id)
// Seconds a flick keeps coasting (GSAP's default is 2.8); the distance shrinks with it.
const FLICK_COAST = 1.6

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -10% 0px' })
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}

function useActiveSection() {
  const [active, setActive] = useState('home')
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id) })
    }, { rootMargin: '-45% 0px -45% 0px' })
    TRACKED_SECTIONS.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])
  return active
}

// A pinned chapter sits inside a pin-spacer and moves while pinned, so its own offset is not
// where the chapter starts. Measure the spacer instead.
function sectionTop(target) {
  const anchor = target.parentElement?.classList.contains('pin-spacer') ? target.parentElement : target
  return anchor.getBoundingClientRect().top + window.scrollY
}

function scrollToSection(id, behavior) {
  const target = document.getElementById(id)
  if (!target) return false
  window.scrollTo({ top: sectionTop(target), behavior })
  return true
}

// In-page links go through sectionTop() so pinned chapters open at their beginning, and a
// deep link (#process) is resolved once ScrollTrigger has measured the pinned distances.
function useAnchorNavigation(reducedMotion) {
  useEffect(() => {
    const onClick = (event) => {
      const link = event.target.closest?.('a[href^="#"]')
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey) return
      const id = link.getAttribute('href').slice(1)
      if (!id || !scrollToSection(id, reducedMotion ? 'auto' : 'smooth')) return
      event.preventDefault()
      window.history.pushState(null, '', `#${id}`)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [reducedMotion])

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return undefined
    // A timer rather than requestAnimationFrame: rAF never fires in a background tab.
    let timer = 0
    document.fonts.ready.then(() => {
      timer = window.setTimeout(() => {
        ScrollTrigger.refresh()
        scrollToSection(hash, 'auto')
      }, 80)
    })
    return () => window.clearTimeout(timer)
  }, [])
}

export default function RetroApp() {
  const reducedMotion = useReducedMotion()
  const [showBoot] = useState(() => !reducedMotion && !alreadyBooted() && !window.location.hash)
  const activeSection = useActiveSection()
  useReveal()
  useAnchorNavigation(reducedMotion)

  useEffect(() => {
    document.fonts.ready.then(() => requestScrollRefresh())
  }, [])

  // Touch screens: scroll on the JavaScript thread so pinned chapters stay in step with the finger
  // instead of jumping, and shorten the coast after a flick. A drag still follows the finger 1:1.
  useEffect(() => {
    if (reducedMotion || !ScrollTrigger.isTouch) return undefined
    ScrollTrigger.normalizeScroll({ type: 'touch', allowNestedScroll: true, momentum: FLICK_COAST })
    return () => ScrollTrigger.normalizeScroll(false)
  }, [reducedMotion])

  return (
    <div className="retro">
      <a className="skip-link" href="#main">Skip to content</a>
      <BootScreen enabled={showBoot} />
      <Navigation activeSection={activeSection} />
      <ChapterIndicator activeSection={activeSection} />
      <main id="main">
        <SkylineHero reducedMotion={reducedMotion} introDelay={showBoot ? 2.4 : 0.2} />
        <Prelude reducedMotion={reducedMotion} />
        <CaseFiles />
        <AboutZoom reducedMotion={reducedMotion} />
        <Gazette reducedMotion={reducedMotion} />
        <Capabilities reducedMotion={reducedMotion} />
        <Lab />
        <ProcessFlow />
        <Quality />
        <Assembler reducedMotion={reducedMotion} />
        <Convinced reducedMotion={reducedMotion} />
        <StartProject reducedMotion={reducedMotion} />
      </main>
      <AmbientBackdrop reducedMotion={reducedMotion} />
      <Toast />
      <CrtOverlay />
    </div>
  )
}

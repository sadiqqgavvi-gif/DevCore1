import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Menu, Phone, X } from 'lucide-react'
import { BOOT_KEY } from './boot.js'
import { chapters, EMAIL, navLinks } from './data.js'

const STRIPES = ['#e8483a', '#f08a2c', '#f2c94c', '#4bb36b', '#3d7be0', '#7a5cd6']

export function LogoMark({ size = 26 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs><clipPath id="logo-disc"><circle cx="16" cy="16" r="15" /></clipPath></defs>
      <g clipPath="url(#logo-disc)">
        {STRIPES.map((color, index) => <rect key={color} x="0" y={index * 5.4} width="32" height="3.6" fill={color} />)}
      </g>
    </svg>
  )
}

export function Logo({ className = '' }) {
  return (
    <a className={`logo ${className}`} href="#home" aria-label="DevCore home">
      <LogoMark />
      <span>DEVCORE</span>
    </a>
  )
}

const BOOT_SEGMENTS = 22
const WORDMARK = 'DEVCORE'.split('')
// Act one: dark logo reveal. Act two: a short CRT boot flash. Then the tube switches off.
const TIMELINE = { boot: 1300, off: 2050, done: 2500 }
const FAILSAFE_MS = 4500

export function BootScreen({ enabled }) {
  const [phase, setPhase] = useState(enabled ? 'reveal' : 'done')

  useEffect(() => {
    if (!enabled) return undefined
    const timers = Object.entries(TIMELINE).map(([next, delay]) => window.setTimeout(() => {
      setPhase((current) => (current === 'done' || (current === 'off' && next !== 'done') ? current : next))
    }, delay))
    // However the animation fares, the page never stays behind the overlay.
    timers.push(window.setTimeout(() => setPhase('done'), FAILSAFE_MS))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [enabled])

  useEffect(() => {
    if (phase === 'done') {
      document.documentElement.classList.remove('is-booting')
      try { window.sessionStorage.setItem(BOOT_KEY, '1') } catch { /* storage unavailable */ }
      return undefined
    }
    document.documentElement.classList.add('is-booting')
    if (phase === 'off') {
      const timer = window.setTimeout(() => setPhase('done'), TIMELINE.done - TIMELINE.off)
      return () => window.clearTimeout(timer)
    }
    const skip = () => setPhase('off')
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [phase])

  if (phase === 'done') return null

  return (
    <div className={`boot boot--${phase}`} aria-label="DevCore intro" role="region">
      <div className="intro" aria-hidden="true">
        <div className="intro__atmos" />
        <div className="intro__mark">{STRIPES.map((color, index) => <i key={color} style={{ '--i': index, background: color }} />)}</div>
        <div className="intro__word">{WORDMARK.map((letter, index) => <span key={index} style={{ '--i': index }}>{letter}</span>)}</div>
        <p className="intro__tag">INDEPENDENT SOFTWARE STUDIO</p>
        <div className="intro__scan" />
      </div>
      <div className="boot__screen" aria-hidden="true">
        <div className="boot__logo">
          <LogoMark size={150} />
          <strong>DEVCORE</strong>
        </div>
        <p className="boot__meta">DevCore Software Studio, Website<br />Version 1.0</p>
        <div className="boot__bar">
          {Array.from({ length: BOOT_SEGMENTS }, (_, index) => <i key={index} style={{ '--i': index }} />)}
        </div>
        <p className="boot__copy">Copyright (c) DevCore Software Studio, {new Date().getFullYear()}. All Rights Reserved.</p>
      </div>
      <button type="button" className="boot__skip" onClick={() => setPhase('off')}>Skip intro <kbd>ESC</kbd></button>
    </div>
  )
}

function ScrollProgress() {
  const barRef = useRef(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      barRef.current?.style.setProperty('--progress', max > 0 ? String(window.scrollY / max) : '0')
    }
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return <span className="nav__progress" ref={barRef} aria-hidden="true" />
}

export function Navigation({ activeSection }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const activeGroup = navLinks.find(([, href]) => href.slice(1) === activeSection) ? activeSection : null

  useEffect(() => {
    if (!menuOpen) return undefined
    const close = (event) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [menuOpen])

  return (
    <header className={`nav ${menuOpen ? 'is-open' : ''}`}>
      <Logo />
      <nav aria-label="Primary" id="primary-nav">
        {navLinks.map(([label, href]) => (
          <a key={href} href={href} className={activeGroup === href.slice(1) ? 'is-active' : ''} aria-current={activeGroup === href.slice(1) ? 'true' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>
        ))}
      </nav>
      <div className="nav__end">
        <a className="nav__call" href={`mailto:${EMAIL}?subject=Book%20a%20call`}>
          <Phone size={16} strokeWidth={2.2} /> <span>Book a call</span>
        </a>
        <button type="button" className="nav__menu" aria-expanded={menuOpen} aria-controls="primary-nav" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}<span>{menuOpen ? 'Close' : 'Menu'}</span>
        </button>
      </div>
      <ScrollProgress />
    </header>
  )
}

export function ChapterIndicator({ activeSection }) {
  const chapter = chapters.find(([id]) => id === activeSection) || chapters[0]
  return (
    <div className="chapter" aria-hidden="true">
      <span className="chapter__num" key={chapter[1]}>{chapter[1]}</span>
      <span className="chapter__line" />
      <span className="chapter__name" key={chapter[2]}>{chapter[2]}</span>
    </div>
  )
}

export function Toast() {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="toast" role="note">
      <span>DevCore is open to new projects this season.</span>
      <a href="#start">Start a conversation <ArrowRight size={13} /></a>
      <button type="button" aria-label="Dismiss" onClick={() => setOpen(false)}><X size={14} /></button>
    </div>
  )
}

export function CrtOverlay() {
  return (
    <div className="crt-overlay" aria-hidden="true">
      <div className="crt-overlay__grain" />
      <div className="crt-overlay__lines" />
      <div className="crt-overlay__vignette" />
    </div>
  )
}

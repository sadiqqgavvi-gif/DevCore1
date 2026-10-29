import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { PointerTracker, ShaderHeroRenderer } from './shaderHeroRenderer.js'
import './AnimatedShaderHero.css'

// Reduced motion shows a single frame of the shader, taken at this point of the animation.
const STILL_TIME = 14
// Upper bound on drawn pixels. The shader is per-pixel heavy (about 30-45 ms per full-HD-ish
// frame on an Intel UHD 620), and soft procedural clouds hold up well when upscaled.
const MAX_PIXELS = 1280 * 720
// Adaptive resolution: every WINDOW frames, compare the average frame interval with these.
const WINDOW = 40
const SLOW_MS = 24
const FAST_MS = 18
const MIN_QUALITY = 0.45

function pixelRatioFor(width, height, quality) {
  const device = Math.min(window.devicePixelRatio || 1, 2)
  let ratio = Math.min(1, device) * (width < 760 ? 0.75 : 1)
  if (width * height * ratio * ratio > MAX_PIXELS) ratio = Math.sqrt(MAX_PIXELS / (width * height))
  return ratio * quality
}

/**
 * Full-bleed hero over the animated WebGL2 shader: an eyebrow, a trust badge, a two-line
 * gradient headline, a subtitle and two link buttons, entering in a staggered sequence.
 * Without WebGL2 (or if the shader fails) a static warm gradient takes its place; with
 * reduced motion the shader renders one still frame and nothing animates.
 */
export default function AnimatedShaderHero({
  id,
  className = '',
  eyebrow,
  trustBadge,
  headline,
  headingId,
  subtitle,
  buttons,
  children,
}) {
  const hostRef = useRef(null)
  const stageRef = useRef(null)
  const reducedMotion = useReducedMotion()
  // The WebGL context is only created once the hero is about a screen away.
  const [near, setNear] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setNear(true)
      observer.disconnect()
    }, { rootMargin: '100% 0px' })
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  // Renderer lifecycle. State lives on the DOM (data-shader), so frames never re-render React.
  useEffect(() => {
    const host = hostRef.current
    const stage = stageRef.current
    if (!host || !stage || !near) return undefined
    const canvas = document.createElement('canvas')
    canvas.className = 'ash__canvas'
    canvas.setAttribute('aria-hidden', 'true')
    stage.appendChild(canvas)

    const renderer = new ShaderHeroRenderer(canvas)
    if (!renderer.init()) {
      canvas.remove()
      host.dataset.shader = 'fallback'
      return () => { delete host.dataset.shader }
    }
    host.dataset.shader = reducedMotion ? 'still' : 'live'
    const pointer = reducedMotion ? null : new PointerTracker(host, canvas)

    let frame = 0
    let running = false
    let visible = false
    let elapsed = 0
    let last = 0
    // Render-scale multiplier, lowered when frames run slow and raised again (after two calm
    // windows in a row) when there is headroom, so weaker GPUs stay smooth.
    let quality = 1
    let windowFrames = 0
    let windowTime = 0
    let calmWindows = 0
    const drawStill = () => renderer.render(STILL_TIME)
    const tick = (now) => {
      // Time only advances while frames are drawn, so the animation resumes where it paused.
      if (last) {
        const delta = now - last
        elapsed += Math.min(0.1, delta / 1000)
        windowFrames += 1
        windowTime += delta
        if (windowFrames === WINDOW) {
          const average = windowTime / WINDOW
          calmWindows = average < FAST_MS ? calmWindows + 1 : 0
          if (average > SLOW_MS && quality > MIN_QUALITY) {
            quality = Math.max(MIN_QUALITY, quality * 0.8)
            resize()
          } else if (calmWindows >= 2 && quality < 1) {
            quality = Math.min(1, quality * 1.1)
            calmWindows = 0
            resize()
          }
          windowFrames = 0
          windowTime = 0
        }
      }
      last = now
      const { x, y } = pointer.step()
      renderer.render(elapsed, x, y)
      frame = window.requestAnimationFrame(tick)
    }
    const update = () => {
      const shouldRun = visible && !document.hidden && !reducedMotion
      if (shouldRun && !running) {
        running = true
        last = 0
        windowFrames = 0
        windowTime = 0
        frame = window.requestAnimationFrame(tick)
      } else if (!shouldRun && running) {
        running = false
        window.cancelAnimationFrame(frame)
      }
    }

    function resize() {
      const { width, height } = canvas.getBoundingClientRect()
      renderer.resize(width, height, pixelRatioFor(width, height, quality))
      if (reducedMotion) drawStill()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    visibility.observe(host)
    document.addEventListener('visibilitychange', update)

    const onContextLost = (event) => {
      event.preventDefault()
      running = false
      window.cancelAnimationFrame(frame)
      host.dataset.shader = 'fallback'
    }
    canvas.addEventListener('webglcontextlost', onContextLost)

    return () => {
      running = false
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibility.disconnect()
      document.removeEventListener('visibilitychange', update)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      pointer?.dispose()
      renderer.dispose()
      canvas.remove()
      delete host.dataset.shader
    }
  }, [reducedMotion, near])

  // The entrance sequence starts when the hero is actually reached, not on page load.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    // Reduced motion never starts the sequence: the copy is simply shown.
    if (reducedMotion) {
      host.classList.add('is-static')
      return () => host.classList.remove('is-static')
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      host.classList.add('is-in')
      observer.disconnect()
    }, { threshold: 0.3 })
    observer.observe(host)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <section id={id} ref={hostRef} className={`ash ${className}`.trim()} aria-labelledby={headingId}>
      <div className="ash__stage" ref={stageRef} aria-hidden="true">
        <div className="ash__fallback" />
      </div>
      <div className="ash__scrim" aria-hidden="true" />
      <div className="ash__content">
        {eyebrow && <p className="ash__eyebrow ash-fade-down">{eyebrow}</p>}
        {trustBadge && (
          <div className="ash__badge ash-fade-down">
            {trustBadge.icon && <span className="ash__badge-icon" aria-hidden="true">{trustBadge.icon}</span>}
            <span>{trustBadge.text}</span>
          </div>
        )}
        <h2 className="ash__title" id={headingId}>
          <span className="ash__line ash__line--1 ash-fade-up ash-delay-200">{headline.line1}</span>{' '}
          <span className="ash__line ash__line--2 ash-fade-up ash-delay-400">{headline.line2}</span>
        </h2>
        {subtitle && <p className="ash__subtitle ash-fade-up ash-delay-600">{subtitle}</p>}
        {buttons && (
          <div className="ash__actions ash-fade-up ash-delay-800">
            {buttons.primary && (
              <a className="ash__button ash__button--primary" href={buttons.primary.href}>{buttons.primary.text}</a>
            )}
            {buttons.secondary && (
              <a className="ash__button ash__button--secondary" href={buttons.secondary.href}>{buttons.secondary.text}</a>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

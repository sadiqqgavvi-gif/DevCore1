import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { buildSculpture, Sculpture2D, SculptureGL } from './liquidSculpture.js'
import './LiquidSculpture.css'

// The full WebGL2 sculpture (with pointer interaction) only runs where it pays off: a mouse or
// trackpad on a wide screen. Everything else gets the Canvas 2D version.
const RICH_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 1000px)'
const RICH_PARTICLES = 14000
const LIGHT_PARTICLES = 3800

function makeCanvas(host) {
  const canvas = document.createElement('canvas')
  canvas.className = 'liquid__canvas'
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  return canvas
}

/**
 * Liquid particle sculpture. `stateRef.current` holds { form, spin } (0..1), written by the
 * parent's scroll timeline; the sculpture reads it every frame it draws. The canvas is created
 * when the sculpture is about a screen away, pauses off-screen and in hidden tabs, and falls back
 * to a static CSS drawing if no canvas renderer is available.
 */
export default function LiquidSculpture({ stateRef, label, className = '' }) {
  const hostRef = useRef(null)
  const reducedMotion = useReducedMotion()
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

  useEffect(() => {
    const host = hostRef.current
    if (!host || !near) return undefined

    let rich = !reducedMotion && window.matchMedia(RICH_QUERY).matches
    let canvas = makeCanvas(host)
    let renderer = null
    if (rich) {
      const gl = new SculptureGL(canvas, buildSculpture(RICH_PARTICLES))
      if (gl.init()) renderer = gl
      else {
        // A canvas that tried for WebGL cannot give a 2D context: start a fresh one.
        rich = false
        canvas.remove()
        canvas = makeCanvas(host)
      }
    }
    if (!renderer) {
      const light = new Sculpture2D(canvas, buildSculpture(LIGHT_PARTICLES))
      if (light.init()) renderer = light
    }
    if (!renderer) {
      canvas.remove()
      host.dataset.liquid = 'fallback'
      return () => { delete host.dataset.liquid }
    }
    host.dataset.liquid = rich ? 'webgl' : 'canvas'

    // Pointer (WebGL only): eased target in normalised device coordinates.
    const pointer = { x: 0, y: 0, push: 0, tx: 0, ty: 0, tpush: 0 }
    const onMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      pointer.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.ty = 1 - ((event.clientY - rect.top) / rect.height) * 2
      pointer.tpush = 1
    }
    const onLeave = () => { pointer.tpush = 0 }
    if (rich) {
      host.addEventListener('pointermove', onMove, { passive: true })
      host.addEventListener('pointerleave', onLeave, { passive: true })
    }

    let frame = 0
    let running = false
    let visible = false
    let elapsed = 0
    let last = 0
    let drawn = ''
    const draw = (now) => {
      const state = stateRef.current
      if (rich) {
        if (last) elapsed += Math.min(0.1, (now - last) / 1000)
        last = now
        pointer.x += (pointer.tx - pointer.x) * 0.12
        pointer.y += (pointer.ty - pointer.y) * 0.12
        pointer.push += (pointer.tpush - pointer.push) * 0.06
        renderer.render({ time: elapsed, form: state.form, spin: state.spin, pointerX: pointer.x, pointerY: pointer.y, push: pointer.push })
      } else {
        // The 2D version only redraws when the scroll state actually changes.
        const key = `${state.form.toFixed(3)}|${state.spin.toFixed(3)}`
        if (key !== drawn) {
          drawn = key
          renderer.render(state)
        }
      }
    }
    const tick = (now) => {
      draw(now)
      frame = window.requestAnimationFrame(tick)
    }
    const update = () => {
      const shouldRun = visible && !document.hidden
      if (shouldRun && !running) {
        running = true
        last = 0
        frame = window.requestAnimationFrame(tick)
      } else if (!shouldRun && running) {
        running = false
        window.cancelAnimationFrame(frame)
      }
    }

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      renderer.resize(width, height, Math.min(window.devicePixelRatio || 1, 1.5))
      drawn = ''
      if (!running) draw(performance.now())
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
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
      host.dataset.liquid = 'fallback'
    }
    canvas.addEventListener('webglcontextlost', onContextLost)

    return () => {
      running = false
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibility.disconnect()
      document.removeEventListener('visibilitychange', update)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      renderer.dispose()
      canvas.remove()
      delete host.dataset.liquid
    }
  }, [near, reducedMotion, stateRef])

  return (
    <div className={`liquid ${className}`.trim()} ref={hostRef} role="img" aria-label={label}>
      <div className="liquid__fallback" aria-hidden="true"><i /><i /><b /></div>
    </div>
  )
}

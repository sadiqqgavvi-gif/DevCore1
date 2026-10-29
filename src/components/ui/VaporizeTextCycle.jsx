import { useEffect, useRef, useState } from 'react'
import './VaporizeTextCycle.css'

// Sampling step in device pixels: each sampled pixel becomes a 2×2 particle.
const STEP = 2
// Alpha below which a sampled pixel is ignored (anti-aliasing fringe).
const MIN_ALPHA = 60

/**
 * Cycles through words, each one vaporising left to right into drifting particles before the
 * next fades in. The words are real text: the first is in the DOM for screen readers and
 * search engines, and a visible text fallback is shown whenever the canvas is not running
 * (reduced motion, no canvas, before fonts load). The canvas matches the fallback's font and
 * colour, caps its pixel ratio, and only animates while it is on screen.
 */
export default function VaporizeTextCycle({ words, reducedMotion, className = '', hold = 2600, vaporize = 1500, fadeIn = 900, spread = 1 }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const textRef = useRef(null)
  const [running, setRunning] = useState(false)
  const key = words.join('|')

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const text = textRef.current
    const list = key.split('|')
    if (reducedMotion || !wrap || !canvas || !text || list.length < 2) return undefined
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return undefined

    let destroyed = false
    let frame = 0
    let visible = false
    let index = 0
    let phase = 'in'
    let phaseStart = 0
    let width = 0
    let height = 0
    let ratio = 1
    let font = ''
    let fill = '#fff'
    let particles = []
    let bounds = { min: 0, max: 0 }
    let buffer = null

    const drawWord = (alpha) => {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.globalAlpha = alpha
      ctx.fillStyle = fill
      ctx.font = font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(list[index], width / 2, height / 2)
      ctx.globalAlpha = 1
    }

    // Turn the current word's pixels into particles (once per vaporise).
    const sample = () => {
      drawWord(1)
      const w = canvas.width
      const h = canvas.height
      const data = ctx.getImageData(0, 0, w, h).data
      const next = []
      let min = Infinity
      let max = -Infinity
      for (let y = 0; y < h; y += STEP) {
        for (let x = 0; x < w; x += STEP) {
          const i = (y * w + x) * 4
          const a = data[i + 3]
          if (a < MIN_ALPHA) continue
          next.push({ x, y, r: data[i], g: data[i + 1], b: data[i + 2], a, vx: 0, vy: 0, life: 1, free: false })
          if (x < min) min = x
          if (x > max) max = x
        }
      }
      particles = next
      bounds = { min, max }
      buffer = ctx.createImageData(w, h)
    }

    const drawParticles = (elapsed) => {
      const w = canvas.width
      const h = canvas.height
      const data = buffer.data
      data.fill(0)
      // The sweep line crosses the word during the first 70% of the vaporise phase.
      const sweep = bounds.min + (bounds.max - bounds.min + STEP) * Math.min(1, elapsed / (vaporize * 0.7))
      const lift = ratio * spread
      for (const p of particles) {
        if (!p.free && p.x <= sweep) {
          p.free = true
          p.vx = (0.6 + Math.random() * 2.2) * lift
          p.vy = -(0.3 + Math.random() * 1.6) * lift
        }
        if (p.free) {
          p.x += p.vx
          p.y += p.vy
          p.vx *= 0.985
          p.vy -= 0.015 * lift
          p.life -= 0.022
          if (p.life <= 0) continue
        }
        const x = p.x | 0
        const y = p.y | 0
        if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) continue
        const alpha = p.a * p.life
        for (let dy = 0; dy < 2; dy++) {
          let i = ((y + dy) * w + x) * 4
          for (let dx = 0; dx < 2; dx++, i += 4) {
            data[i] = p.r
            data[i + 1] = p.g
            data[i + 2] = p.b
            data[i + 3] = alpha
          }
        }
      }
      ctx.putImageData(buffer, 0, 0)
    }

    const setPhase = (next, now) => {
      phase = next
      phaseStart = now
    }

    const tick = (now) => {
      if (!phaseStart) phaseStart = now
      const elapsed = now - phaseStart
      if (phase === 'in') {
        drawWord(Math.min(1, elapsed / fadeIn))
        if (elapsed >= fadeIn) setPhase('hold', now)
      } else if (phase === 'hold') {
        if (elapsed >= hold) {
          sample()
          setPhase('vapor', now)
        }
      } else {
        drawParticles(elapsed)
        if (elapsed >= vaporize) {
          particles = []
          index = (index + 1) % list.length
          setPhase('in', now)
        }
      }
      frame = window.requestAnimationFrame(tick)
    }

    const start = () => {
      if (destroyed || !visible || frame) return
      frame = window.requestAnimationFrame(tick)
    }
    const stop = () => {
      window.cancelAnimationFrame(frame)
      frame = 0
    }

    // Size the canvas to the text's own line, at a capped pixel ratio.
    const layout = () => {
      const style = getComputedStyle(text)
      const size = parseFloat(style.fontSize) || 48
      font = `${style.fontStyle} ${style.fontWeight} ${size}px ${style.fontFamily}`
      fill = style.color
      ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      width = Math.max(1, wrap.clientWidth)
      height = Math.ceil(size * 1.45)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      canvas.style.height = `${height}px`
      // Restart the current word cleanly after any resize.
      particles = []
      phase = 'hold'
      phaseStart = 0
      drawWord(1)
    }

    const resize = new ResizeObserver(() => { if (!destroyed && wrap.classList.contains('is-running')) layout() })
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })

    // Wait for the web fonts, or the canvas would draw the fallback face.
    document.fonts.ready.then(() => {
      if (destroyed) return
      wrap.classList.add('is-running')
      setRunning(true)
      layout()
      resize.observe(wrap)
      visibility.observe(wrap)
    })

    return () => {
      destroyed = true
      stop()
      resize.disconnect()
      visibility.disconnect()
      wrap.classList.remove('is-running')
      setRunning(false)
    }
  }, [key, reducedMotion, hold, vaporize, fadeIn, spread])

  return (
    <span className={`vapor ${className}`.trim()} ref={wrapRef}>
      <span className="visually-hidden">{words[0]}</span>
      <span className="vapor__text" ref={textRef} aria-hidden="true">{words[0]}</span>
      <canvas className="vapor__canvas" ref={canvasRef} aria-hidden="true" hidden={!running} />
    </span>
  )
}

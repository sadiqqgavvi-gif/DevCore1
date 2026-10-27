import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

export default function CustomCursor({ rootRef }) {
  const cursorRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    const cursor = cursorRef.current
    if (!root || !cursor || reducedMotion || !window.matchMedia('(pointer: fine)').matches) return undefined

    const ring = cursor.querySelector('.cursor-ring')
    const dot = cursor.querySelector('.cursor-dot')
    const label = cursor.querySelector('.cursor-label')
    const quickX = gsap.quickTo(ring, 'x', { duration: 0.36, ease: 'power3.out' })
    const quickY = gsap.quickTo(ring, 'y', { duration: 0.36, ease: 'power3.out' })
    const quickDotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' })
    const quickDotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' })
    const handleMove = (event) => {
      quickX(event.clientX)
      quickY(event.clientY)
      quickDotX(event.clientX)
      quickDotY(event.clientY)
    }
    const handleOver = (event) => {
      const target = event.target.closest('a, button, [data-cursor-label]')
      if (!target || !root.contains(target)) return
      cursor.classList.add('is-hovering')
      label.textContent = target.dataset.cursorLabel || (target.matches('a') ? 'OPEN' : 'SELECT')
    }
    const handleOut = (event) => {
      if (!event.target.closest('a, button, [data-cursor-label]')) return
      if (event.relatedTarget?.closest('a, button, [data-cursor-label]')) return
      cursor.classList.remove('is-hovering')
      label.textContent = ''
    }

    root.classList.add('has-custom-cursor')
    window.addEventListener('pointermove', handleMove, { passive: true })
    root.addEventListener('pointerover', handleOver)
    root.addEventListener('pointerout', handleOut)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      root.removeEventListener('pointerover', handleOver)
      root.removeEventListener('pointerout', handleOut)
      root.classList.remove('has-custom-cursor')
      gsap.killTweensOf([ring, dot])
    }
  }, [reducedMotion, rootRef])

  return (
    <div className="custom-cursor" ref={cursorRef} aria-hidden="true">
      <span className="cursor-ring"><i className="cursor-label" /></span>
      <span className="cursor-dot" />
    </div>
  )
}

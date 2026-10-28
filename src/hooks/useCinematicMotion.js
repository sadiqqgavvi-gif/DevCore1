import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap.js'
import { useReducedMotion } from './useReducedMotion.js'

/**
 * Extra scroll-driven motion layered on top of the existing page motion:
 *  - the signal band skews with scroll velocity
 *  - Work cards get live --focus / --offset CSS variables (desktop pinned journey only),
 *    which cinematic.css uses for depth, lighting and parallax.
 */
export function useCinematicMotion(rootRef) {
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    const root = rootRef.current
    if (!root || reducedMotion) return undefined

    let timer = 0
    const responsiveMotion = gsap.matchMedia()

    const band = root.querySelector('.signal-band')
    const skewTarget = root.querySelector('.signal-band__skew')
    if (band && skewTarget) {
      const skewTo = gsap.quickTo(skewTarget, 'skewX', { duration: 0.6, ease: 'power3.out' })
      ScrollTrigger.create({
        trigger: band,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          skewTo(gsap.utils.clamp(-8, 8, self.getVelocity() / -260))
          window.clearTimeout(timer)
          timer = window.setTimeout(() => skewTo(0), 140)
        },
        onLeave: () => skewTo(0),
        onLeaveBack: () => skewTo(0),
      })
    }

    responsiveMotion.add('(min-width: 761px)', () => {
      const cards = gsap.utils.toArray('.work-card', root)
      if (!cards.length) return undefined

      const update = () => {
        const width = window.innerWidth
        const middle = width / 2
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect()
          const offset = (rect.left + rect.width / 2 - middle) / width
          const focus = Math.max(0, 1 - Math.abs(offset) * 1.55)
          card.style.setProperty('--offset', offset.toFixed(3))
          card.style.setProperty('--focus', focus.toFixed(3))
        })
      }

      ScrollTrigger.create({
        trigger: '.work-journey',
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: update,
        onRefresh: update,
        onToggle: update,
      })
      update()

      return () => {
        cards.forEach((card) => {
          card.style.removeProperty('--offset')
          card.style.removeProperty('--focus')
        })
      }
    })

    return () => {
      window.clearTimeout(timer)
      responsiveMotion.revert()
    }
  }, { scope: rootRef, dependencies: [reducedMotion], revertOnUpdate: true })
}

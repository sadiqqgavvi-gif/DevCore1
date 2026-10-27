import { useEffect } from 'react'
import { gsap, useGSAP } from '../lib/gsap.js'
import { useReducedMotion } from './useReducedMotion.js'

export function usePageMotion(rootRef) {
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    const root = rootRef.current
    if (!root) return

    if (reducedMotion) {
      gsap.set('.reveal, .reveal-child', { autoAlpha: 1, clearProps: 'transform,filter' })
      return
    }

    gsap.utils.toArray('.reveal', root).forEach((element) => {
      gsap.fromTo(element,
        { autoAlpha: 0, y: 28, filter: 'blur(5px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        },
      )
    })

    gsap.utils.toArray('.section-kicker', root).forEach((element) => {
      const rule = element.querySelector('.kicker-rule')
      if (!rule) return
      gsap.fromTo(rule, { scaleX: 0, transformOrigin: 'left center' }, {
        scaleX: 1,
        duration: 0.9,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: element, start: 'top 90%', once: true },
      })
    })

    gsap.utils.toArray('.reveal-group', root).forEach((group) => {
      const children = group.querySelectorAll('.reveal-child')
      if (!children.length) return
      gsap.fromTo(children,
        { autoAlpha: 0, y: 32, rotateX: 5, transformPerspective: 900 },
        {
          autoAlpha: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.16,
          ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 82%', once: true },
        },
      )
    })

    gsap.fromTo('.about-oversized', { xPercent: 8 }, {
      xPercent: -6,
      ease: 'none',
      scrollTrigger: { trigger: '.intro', start: 'top bottom', end: 'bottom top', scrub: 1 },
    })
  }, { scope: rootRef, dependencies: [reducedMotion], revertOnUpdate: true })

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const targets = root.querySelectorAll('[data-spotlight]')
    const handlePointerMove = (event) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      event.currentTarget.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`)
      event.currentTarget.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`)
    }
    targets.forEach((target) => target.addEventListener('pointermove', handlePointerMove, { passive: true }))
    return () => targets.forEach((target) => target.removeEventListener('pointermove', handlePointerMove))
  }, [rootRef])
}

import { useRef } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { gsap, useGSAP } from '../../lib/gsap.js'

const text = 'Good software should feel inevitable. Made by a small team, with end-to-end craft — from the first sketch to the last line of code.'
const words = text.split(' ')

export default function Statement() {
  const sectionRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (reducedMotion) return

    gsap.fromTo('.statement__word',
      { opacity: 0.1, y: 12, filter: 'blur(4px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          end: 'bottom 58%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      },
    )
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="statement section-wrap" ref={sectionRef}>
      <p className="eyebrow">A NOTE FROM THE STUDIO</p>
      <p className="statement__text" aria-label={text}>
        {words.map((word, index) => (
          <span
            className={`statement__word${word.startsWith('inevitable') ? ' statement__word--accent' : ''}`}
            key={`${word}-${index}`}
            aria-hidden="true"
          >
            {word}
          </span>
        ))}
      </p>
      <div className="statement__foot"><span>D / STUDIO NOTE</span><span className="statement__rule" /><span>LESS NOISE. MORE INTENTION.</span></div>
    </section>
  )
}

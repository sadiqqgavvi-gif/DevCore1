import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import VaporizeTextCycle from '../components/ui/VaporizeTextCycle.jsx'
import { gsap, useGSAP } from '../lib/gsap.js'
import { EMAIL } from './data.js'

function CubicleFarm() {
  return (
    <div className="farm" aria-hidden="true">
      <div className="farm__plane">
        {Array.from({ length: 80 }, (_, index) => (
          <div className="farm__desk" key={index}>
            <span className="farm__wall" />
            <span className="farm__crt"><b /></span>
            <span className="farm__chair" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AboutZoom({ reducedMotion }) {
  const sectionRef = useRef(null)
  useGSAP(() => {
    if (reducedMotion) return
    // One camera move: descend over the office, let the title settle, then a sheet of paper
    // rises into frame and becomes the Gazette below.
    gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
      .fromTo('.farm', { scale: 0.85, yPercent: -6, rotate: 4 }, { scale: 2.1, yPercent: 16, rotate: -3, ease: 'power1.inOut', duration: 1 }, 0)
      .fromTo('.about-zoom__title', { scale: 0.8, autoAlpha: 0.4, yPercent: 10 }, { scale: 1.12, autoAlpha: 1, yPercent: -8, ease: 'none', duration: 0.75 }, 0)
      .fromTo('.about-zoom__caption span', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.18 }, 0.22)
      .to('.about-zoom__caption span', { autoAlpha: 0, y: -16, stagger: 0.05, duration: 0.12 }, 0.7)
      .fromTo('.about-zoom__dusk', { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: 0.3 }, 0.66)
      .fromTo('.about-zoom__sheet', { yPercent: 100, rotateX: 18 }, { yPercent: 0, rotateX: 0, ease: 'power2.out', duration: 0.28 }, 0.72)
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="about-zoom" id="about" ref={sectionRef}>
      <div className="about-zoom__stage">
        <CubicleFarm />
        <h2 className="about-zoom__title">About Us</h2>
        <p className="about-zoom__caption"><span>Not a cubicle farm.</span> <span>A small studio,</span> <span>end-to-end.</span></p>
        <div className="about-zoom__dusk" aria-hidden="true" />
        <div className="about-zoom__sheet" aria-hidden="true" />
      </div>
    </section>
  )
}

export function Convinced({ reducedMotion }) {
  const sectionRef = useRef(null)
  useGSAP(() => {
    if (reducedMotion) return
    // A single lit rule draws across as the line is read, then the spotlight opens onto
    // Chapter 11 below.
    gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', end: 'bottom 40%', scrub: 0.5 } })
      .fromTo('.convinced__rule', { scaleX: 0 }, { scaleX: 1, ease: 'power2.out', duration: 0.6 }, 0)
      .fromTo('.convinced__spot', { autoAlpha: 0, scaleY: 0.4 }, { autoAlpha: 1, scaleY: 1, ease: 'none', duration: 0.4 }, 0.6)
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="convinced" ref={sectionRef}>
      <div className="convinced__copy">
        <h2 className="glow reveal">Still Not Convinced We&rsquo;re Serious About Software?</h2>
        <p className="reveal">We&rsquo;ve got one last trick up our sleeves.</p>
      </div>
      <span className="convinced__rule" aria-hidden="true" />
      <span className="convinced__spot" aria-hidden="true" />
    </section>
  )
}

const PROJECT_MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent('Project enquiry')}`

// Chapter 11: the closing statement, on a clean background. The vaporising word is the
// "one last trick" promised just above.
export function StartProject({ reducedMotion }) {
  return (
    <section className="start" id="start" aria-labelledby="start-title">
      <p className="kicker reveal">Chapter 11 — Start a project</p>
      <h2 id="start-title" className="start__title">
        <span className="start__lead reveal">Start something</span>{' '}
        <VaporizeTextCycle className="start__vapor" words={['extraordinary.', 'useful.', 'built to last.']} reducedMotion={reducedMotion} />
      </h2>
      <p className="start__lede reveal">Bring the idea. We&rsquo;ll design and engineer it into a product people can rely on.</p>
      <div className="start__actions reveal">
        <a className="button-cream" href={PROJECT_MAIL}>Start a project <ArrowRight size={15} /></a>
        <a className="start__mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </div>
    </section>
  )
}

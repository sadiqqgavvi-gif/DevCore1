import { useRef } from 'react'
import { ArrowDown, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { gsap, useGSAP } from '../../lib/gsap.js'
import './Hero.css'

export default function Hero({ motionState }) {
  const heroRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (reducedMotion) return

    gsap.set('.story-panel', { autoAlpha: 0, y: 18 })
    gsap.set('.hero-story-ui', { autoAlpha: 0, y: 0 })

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo('.hero-eyebrow', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.1)
      .fromTo('.hero-line-inner', { yPercent: 110, rotateX: -10 }, { yPercent: 0, rotateX: 0, duration: 1.15, stagger: 0.14 }, 0.18)
      .fromTo('.hero-description, .hero-actions', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.12 }, 0.72)

    const story = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    })
    story.to(motionState.current, { progress: 1, duration: 1, ease: 'none' }, 0)
    story.to('.hero-copy, .hero-bottom, .hero-index', { autoAlpha: 0, y: -22, duration: 0.06 }, 0.08)
    story.to('.hero-story-ui', { autoAlpha: 1, duration: 0.04 }, 0.14)
    story.fromTo('.story-panel-1', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.18)
    story.to('.story-panel-1', { autoAlpha: 0, y: -25, duration: 0.06 }, 0.35)
    story.fromTo('.story-panel-2', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.41)
    story.to('.story-panel-2', { autoAlpha: 0, y: -22, duration: 0.06 }, 0.58)
    story.fromTo('.story-panel-3', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.64)
    story.to('.story-panel-3', { autoAlpha: 0, y: -22, duration: 0.06 }, 0.76)
    story.fromTo('.story-panel-4', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.82)
    story.fromTo('.story-meter-fill', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'none' }, 0)
    story.fromTo('.story-index-current', { innerText: 1 }, { innerText: 4, snap: { innerText: 1 }, duration: 1, ease: 'none' }, 0)
    story.to('.hero-story-ui', { autoAlpha: 0, duration: 0.04 }, 0.96)
    story.to('.hero-exit-mark', { autoAlpha: 1, scale: 1, duration: 0.12 }, 0.87)
  }, { scope: heroRef, dependencies: [motionState, reducedMotion], revertOnUpdate: true })

  return (
    <section className="hero-experience" id="home" ref={heroRef}>
      <div className="hero-stage">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy hero-stage-one">
          <p className="eyebrow hero-eyebrow"><span className="status-dot" /> INDEPENDENT SOFTWARE STUDIO <span className="eyebrow-year">— EST. FOR WHAT&apos;S NEXT</span></p>
          <h1 className="hero-headline" aria-label="Ideas into what’s next.">
            <span className="headline-line"><span className="hero-line-inner">Ideas into</span></span>
            <span className="headline-line"><span className="hero-line-inner headline-accent">what’s next.</span></span>
          </h1>
          <p className="hero-description">We design and build digital products, intelligent systems, and experiences that move your business forward.</p>
          <div className="hero-actions">
            <a className="button button-primary magnetic" data-cursor-label="SAY HELLO" href="#contact">Let’s talk <ArrowUpRight size={16} /></a>
            <a className="button button-quiet" href="#services">Explore what we do <ArrowDown size={15} /></a>
          </div>
        </div>
        <div className="hero-stage-annotations"><span>FIG. 01 / DEVCORE SYSTEMS</span><span>REAL-TIME / PROCEDURAL / INTERACTIVE</span></div>
        <div className="hero-story-ui">
          <div className="story-index"><span className="story-index-current">1</span><i>/ 04</i></div>
          <div className="story-meter"><span className="story-meter-fill" /></div>
          <div className="story-panel story-panel-1">
            <p className="eyebrow">01 — THE FORM</p>
            <h2>Complexity,<br /><span>made coherent.</span></h2>
            <p>Every useful product starts with a clear point of view — and the craft to bring it to life.</p>
          </div>
          <div className="story-panel story-panel-2">
            <p className="eyebrow">02 — THE SYSTEM</p>
            <h2>See the whole.<br /><span>Understand the parts.</span></h2>
            <p>We connect product thinking, design, and engineering from the very first decision.</p>
          </div>
          <div className="story-panel story-panel-3">
            <p className="eyebrow">03 — THE CONNECTIONS</p>
            <h2>Built to work<br /><span>as one.</span></h2>
            <p>Interfaces, intelligence, and infrastructure — thoughtfully joined into a dependable whole.</p>
          </div>
          <div className="story-panel story-panel-4">
            <p className="eyebrow">04 — THE OUTCOME</p>
            <h2>Ideas into<br /><span>what’s next.</span></h2>
            <a className="story-link" href="#services">Explore what we build <ArrowDownRight size={16} /></a>
          </div>
        </div>
        <div className="hero-bottom">
          <span>STRATEGY <i>·</i> DESIGN <i>·</i> ENGINEERING</span>
          <a href="#about"><span className="hero-scroll-label">SCROLL TO EXPLORE</span> <ArrowDown size={13} /></a>
          <span>INDEPENDENT SOFTWARE STUDIO</span>
        </div>
        <span className="hero-index">D / 01<span>CREATIVE SYSTEMS<br />&amp; DIGITAL PRODUCTS</span></span>
        <span className="hero-exit-mark" aria-hidden="true">D / SYSTEM READY</span>
      </div>
    </section>
  )
}

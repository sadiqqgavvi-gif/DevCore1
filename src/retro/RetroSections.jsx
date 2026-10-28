import { Fragment, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap.js'
import { EMAIL, houseRules, projects } from './data.js'
import { OPEN_CASE_EVENT } from './events.js'
import { LogoMark } from './RetroChrome.jsx'
import RetroComputer from './RetroComputer.jsx'
import { SceneBoundary } from './scenes/SceneMount.jsx'
import { detectWebGL } from './scenes/webgl.js'

// The carousel occupies the first 86% of the hero; the rest is the dive into the next chapter.
const HERO_EXIT = 0.86
const HERO_STOPS = projects.map((_, index) => ((index + 0.5) / projects.length) * HERO_EXIT)
const STORY_TITLE = 'Making Digital Products More Thoughtful, Useful, and Alive'

export function Hero({ reducedMotion, introDelay }) {
  const [webgl] = useState(detectWebGL)
  const sectionRef = useRef(null)
  const triggerRef = useRef(null)
  const progressRef = useRef(0)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    const stage = sectionRef.current
    const syncExit = (progress) => stage.style.setProperty('--hero-exit', Math.min(1, Math.max(0, (progress - HERO_EXIT) / (1 - HERO_EXIT))).toFixed(3))
    triggerRef.current = ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: 'bottom bottom',
      // Settle on a project (or leave the hero) instead of stopping halfway between two.
      snap: reducedMotion ? undefined : { snapTo: [0, ...HERO_STOPS, 1], directional: false, inertia: false, duration: { min: 0.25, max: 0.6 }, delay: 0.12, ease: 'power2.out' },
      // Refresh (resize, orientation, fonts) re-derives the exit veil too, so it is never left stale.
      onRefresh: (self) => syncExit(self.progress),
      onUpdate: (self) => {
        progressRef.current = self.progress
        syncExit(self.progress)
        const next = Math.min(projects.length - 1, Math.floor((self.progress / HERO_EXIT) * projects.length))
        if (next !== activeRef.current) {
          activeRef.current = next
          setActive(next)
        }
      },
    })
    if (reducedMotion) return
    gsap.timeline({ defaults: { ease: 'power3.out' }, delay: introDelay + 0.35 })
      .from('.hero__line', { yPercent: 40, autoAlpha: 0, filter: 'blur(8px)', duration: 1.1, stagger: 0.12 })
      .from('.hero__scroll, .work-bar', { autoAlpha: 0, y: 14, duration: 0.7, stagger: 0.1 }, '-=0.6')
  }, { scope: sectionRef, dependencies: [reducedMotion, introDelay], revertOnUpdate: true })

  const goTo = (index) => {
    const st = triggerRef.current
    if (!st) return
    const target = (index + projects.length) % projects.length
    window.scrollTo({ top: st.start + (st.end - st.start) * HERO_STOPS[target], behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const project = projects[active]

  return (
    <section className="hero" id="home" ref={sectionRef}>
      <div className="hero__stage">
        <div className="hero__smoke" aria-hidden="true"><i /><i /><i /></div>
        {webgl ? (
          <SceneBoundary fallback={<div className="retro-computer retro-computer--fallback" aria-hidden="true"><LogoMark size={160} /></div>}>
            <RetroComputer projects={projects} activeIndex={active} progressRef={progressRef} reducedMotion={reducedMotion} introDelay={introDelay} />
          </SceneBoundary>
        ) : <div className="retro-computer retro-computer--fallback" aria-hidden="true"><LogoMark size={160} /></div>}
        <div className="hero__copy">
          <h1 className="glow">
            <span className="hero__line">A Software Studio,</span>{' '}
            <span className="hero__line">Wired into</span>{' '}
            <span className="hero__line">What&rsquo;s Next</span>
          </h1>
          <a className="hero__scroll" href="#work">
            Scroll to Inspect Our Selected Work
            <span className="hero__dots" aria-hidden="true">
              {projects.map((item, index) => <i key={item.number} className={index === active ? 'is-on' : ''} />)}
            </span>
          </a>
        </div>
        <div className="work-bar" role="group" aria-label="Selected work carousel">
          <button type="button" onClick={() => goTo(active - 1)} aria-label="Previous project"><ArrowLeft size={16} /></button>
          <div className="work-bar__info" aria-live="polite">
            <span>{project.number} / 0{projects.length} — {project.kicker}</span>
            <strong>{project.title}</strong>
            <em>{project.description}</em>
            <button type="button" className="work-bar__open" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CASE_EVENT, { detail: active }))}>
              Open case file <ArrowUpRight size={13} />
            </button>
          </div>
          <button type="button" onClick={() => goTo(active + 1)} aria-label="Next project"><ArrowRight size={16} /></button>
        </div>
      </div>
    </section>
  )
}

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
        <div className="about-zoom__sheet paper" aria-hidden="true" />
      </div>
    </section>
  )
}

export function Story({ reducedMotion }) {
  const sectionRef = useRef(null)
  useGSAP(() => {
    if (reducedMotion) return
    // Editorial motion: rules are drawn, the headline is set word by word, the sidebar drifts
    // at a slightly different depth to the columns.
    gsap.fromTo('.story__masthead', { '--rule': 0 }, { '--rule': 1, duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: '.story__masthead', start: 'top 90%', once: true } })
    gsap.fromTo('.story__title .word > span', { yPercent: 110, rotate: 4 }, {
      yPercent: 0, rotate: 0, stagger: 0.045, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.story__title', start: 'top 85%', once: true },
    })
    gsap.fromTo('.story__columns blockquote', { scale: 0.92, rotate: -2, autoAlpha: 0 }, {
      scale: 1, rotate: 0, autoAlpha: 1, duration: 0.8, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: '.story__columns blockquote', start: 'top 85%', once: true },
    })
    gsap.matchMedia().add('(min-width: 1081px)', () => {
      gsap.fromTo('.story__aside', { y: 60 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.story__layout', start: 'top bottom', end: 'bottom top', scrub: 0.8 } })
    })
    gsap.fromTo('.story__statement > span > span', { yPercent: 105 }, {
      yPercent: 0, stagger: 0.1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.story__statement', start: 'top 82%', once: true },
    })
    gsap.fromTo('.venn circle', { strokeDashoffset: 1 }, {
      strokeDashoffset: 0, duration: 1.4, stagger: 0.25, ease: 'power2.inOut',
      scrollTrigger: { trigger: '.venn', start: 'top 80%', once: true },
    })
    gsap.fromTo('.story__columns > *', { y: 26, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '.story__columns', start: 'top 82%', once: true },
    })
    const depth = { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
    gsap.fromTo('.gazette__layers i:nth-child(1)', { y: 80, rotate: -2.2 }, { y: -60, rotate: -1.2, ease: 'none', scrollTrigger: depth })
    gsap.fromTo('.gazette__layers i:nth-child(2)', { y: 140, rotate: 1.8 }, { y: -110, rotate: 2.6, ease: 'none', scrollTrigger: depth })
    gsap.utils.toArray('.gazette__fragments span').forEach((fragment, index) => {
      gsap.fromTo(fragment, { y: 160 + index * 60, rotate: index % 2 ? 14 : -12 }, { y: -220 - index * 70, rotate: index % 2 ? -6 : 8, ease: 'none', scrollTrigger: depth })
    })
    // Leaving: the sheet settles back into the dark rather than simply scrolling away.
    gsap.fromTo('.story', { rotateX: 0, scale: 1, transformPerspective: 1600, transformOrigin: '50% 100%' }, {
      rotateX: 6, scale: 0.965, ease: 'none',
      scrollTrigger: { trigger: sectionRef.current, start: 'bottom 90%', end: 'bottom top', scrub: 0.8 },
    })
    gsap.fromTo('.story__annotation', { autoAlpha: 0, rotate: -10, x: -10 }, {
      autoAlpha: 1, rotate: -4, x: 0, duration: 0.6, delay: 0.9,
      scrollTrigger: { trigger: '.venn', start: 'top 80%', once: true },
    })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="gazette zone" id="studio" ref={sectionRef} aria-labelledby="story-title">
      <div className="gazette__layers" aria-hidden="true"><i /><i /></div>
      <div className="gazette__fragments" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="paper story">
      <div className="paper__curl" aria-hidden="true" />
      <div className="story__masthead">
        <span>VOL. 01</span>
        <strong>The DevCore Gazette</strong>
        <span>PRICE: ONE GOOD CONVERSATION</span>
      </div>
      <p className="story__edition">STUDIO EDITION · WHAT WE BUILD · HOW WE THINK · WHY IT MATTERS</p>
      <h2 id="story-title" className="story__title" aria-label={STORY_TITLE}>
        {STORY_TITLE.split(' ').map((word, index) => <Fragment key={index}>{index > 0 && ' '}<span className="word" aria-hidden="true"><span>{word}</span></span></Fragment>)}
      </h2>
      <div className="story__layout">
        <div className="story__columns">
          <h3 className="story__subhead">What we build</h3>
          <p className="dropcap">DevCore is an independent software studio that designs and builds digital products, intelligent systems and experiences for the web. Small by design, serious about craft, and working with ambitious teams wherever they happen to be.</p>
          <h3 className="story__subhead">How we solve problems</h3>
          <p>We start with the problem, not the tool. Before adding layers, frameworks or features, we make sure we understand who the product is for and what would make their day easier.</p>
          <blockquote>&ldquo;Less noise. More intention.&rdquo;<cite>— The DevCore house motto</cite></blockquote>
          <h3 className="story__subhead">Design and engineering, together</h3>
          <p>From the first sketch to the last line of code, the same small team carries the work. Nothing gets lost in a handoff, because there isn&rsquo;t one. We&rsquo;re not your regular IT department. We don&rsquo;t reboot the fax machine.</p>
        </div>
        <aside className="story__aside reveal" aria-label="Studio at a glance">
          <figure className="venn">
            <svg viewBox="0 0 260 180" role="img" aria-label="Diagram: design and engineering overlap, and DevCore works in the overlap">
              <circle cx="95" cy="90" r="72" pathLength="1" />
              <circle cx="165" cy="90" r="72" pathLength="1" />
              <text x="58" y="94">Design</text>
              <text x="160" y="94">Engineering</text>
              <text className="venn__core" x="130" y="128">DEVCORE</text>
            </svg>
            <figcaption>Fig. 1 — Where the work happens.</figcaption>
          </figure>
          <p className="story__annotation" aria-hidden="true">&larr; no handoffs, no lost details</p>
          <div className="story__brief">
            <h4>In brief</h4>
            <ul>
              <li>Small team, end-to-end craft</li>
              <li>Strategy · Design · Engineering</li>
              <li>Built to evolve, ready for what changes</li>
            </ul>
          </div>
        </aside>
      </div>
      <p className="story__statement" aria-label="Good software should feel inevitable.">
        <span aria-hidden="true"><span>Good software</span></span>
        <span aria-hidden="true"><span>should feel</span></span>
        <span aria-hidden="true"><span><em>inevitable.</em></span></span>
      </p>
      <div className="rules">
        <h3 className="classifieds__head"><span>Editorial</span> Studio Philosophy</h3>
        <ol>
          {houseRules.map(([numeral, title, description]) => (
            <li className="reveal" key={numeral}><b>{numeral}</b><div><h4>{title}</h4><p>{description}</p></div></li>
          ))}
        </ol>
      </div>
      </div>
    </section>
  )
}

export function Convinced({ reducedMotion }) {
  const sectionRef = useRef(null)
  useGSAP(() => {
    if (reducedMotion) return
    // A single lit rule draws across as the line is read, then the spotlight opens onto the
    // final reel of Chapter 11 below.
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

function Globe() {
  return (
    <svg viewBox="0 0 120 80" className="badge-svg" aria-hidden="true">
      <ellipse cx="60" cy="36" rx="34" ry="30" fill="none" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="60" cy="36" rx="14" ry="30" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {[16, 26, 36, 46, 56].map((y) => <line key={y} x1="28" x2="92" y1={y} y2={y} stroke="currentColor" strokeWidth="2.5" />)}
      <line x1="60" x2="60" y1="6" y2="66" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  )
}

function Laurel() {
  const leaves = Array.from({ length: 6 }, (_, index) => index)
  return (
    <svg viewBox="0 0 140 90" className="badge-svg badge-svg--laurel" aria-hidden="true">
      {[-1, 1].map((side) => (
        <g key={side} transform={side === 1 ? 'translate(140 0) scale(-1 1)' : undefined}>
          <path d="M34 82C14 66 10 40 22 14" fill="none" stroke="currentColor" strokeWidth="2.5" />
          {leaves.map((leaf) => (
            <ellipse key={leaf} cx={18 + leaf * 0.4} cy={72 - leaf * 11} rx="4" ry="9" fill="currentColor" transform={`rotate(${-35 + leaf * 4} ${18 + leaf * 0.4} ${72 - leaf * 11})`} />
          ))}
        </g>
      ))}
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__badge"><Globe /><span>BUILT FOR THE<br />WORLD WIDE WEB</span></div>
      <div className="footer__center">
        <a className="logo" href="#home"><LogoMark /><span>DEVCORE</span></a>
        <em>A High-Tech Software Solutions Studio</em>
        <small>&copy; DevCore Studio {new Date().getFullYear()}. All Rights Reserved.</small>
      </div>
      <a className="footer__badge footer__badge--laurel" href={`mailto:${EMAIL}`}>
        <Laurel /><span>MADE WITH<br />INTENTION<ArrowUpRight size={11} /></span>
      </a>
      <div className="footer__wordmark reveal" aria-hidden="true">
        {'DEVCORE'.split('').map((letter, index) => <span key={index} style={{ '--i': index }}>{letter}</span>)}
      </div>
      <a className="footer__top" href="#home">Back to the beginning ↑</a>
    </footer>
  )
}

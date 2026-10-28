import { lazy, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Mail } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap.js'
import { EMAIL, houseRules, projects } from './data.js'
import { OPEN_CASE_EVENT } from './events.js'
import { LogoMark } from './RetroChrome.jsx'
import RetroComputer from './RetroComputer.jsx'
import SceneMount, { SceneBoundary } from './scenes/SceneMount.jsx'
import { detectWebGL } from './scenes/webgl.js'

const GoldenFloppyScene = lazy(() => import('./GoldenFloppy.jsx'))

export function Hero({ reducedMotion, introDelay }) {
  const [webgl] = useState(detectWebGL)
  const sectionRef = useRef(null)
  const triggerRef = useRef(null)
  const progressRef = useRef(0)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    triggerRef.current = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progressRef.current = self.progress
        const next = Math.min(projects.length - 1, Math.floor(self.progress * projects.length))
        if (next !== activeRef.current) {
          activeRef.current = next
          setActive(next)
        }
      },
    })
    if (reducedMotion) return
    gsap.timeline({ defaults: { ease: 'power3.out' }, delay: introDelay })
      .from('.hero__line', { yPercent: 40, autoAlpha: 0, filter: 'blur(8px)', duration: 1.1, stagger: 0.12 })
      .from('.hero__scroll, .work-bar', { autoAlpha: 0, y: 14, duration: 0.7, stagger: 0.1 }, '-=0.6')
  }, { scope: sectionRef, dependencies: [reducedMotion, introDelay], revertOnUpdate: true })

  const goTo = (index) => {
    const st = triggerRef.current
    if (!st) return
    const target = (index + projects.length) % projects.length
    window.scrollTo({ top: st.start + (st.end - st.start) * ((target + 0.5) / projects.length), behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const project = projects[active]

  return (
    <section className="hero" id="home" ref={sectionRef}>
      <div className="hero__stage">
        <div className="hero__smoke" aria-hidden="true"><i /><i /><i /></div>
        {webgl ? (
          <SceneBoundary fallback={<div className="retro-computer retro-computer--fallback" aria-hidden="true"><LogoMark size={160} /></div>}>
            <RetroComputer projects={projects} activeIndex={active} progressRef={progressRef} reducedMotion={reducedMotion} />
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
    gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
      .fromTo('.farm', { scale: 0.9, yPercent: 0 }, { scale: 1.9, yPercent: 14, ease: 'none' }, 0)
      .fromTo('.about-zoom__title', { scale: 0.85, autoAlpha: 0.55 }, { scale: 1.15, autoAlpha: 1, ease: 'none' }, 0)
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="about-zoom" id="about" ref={sectionRef}>
      <div className="about-zoom__stage">
        <CubicleFarm />
        <h2 className="about-zoom__title">About Us</h2>
      </div>
    </section>
  )
}

export function Story({ reducedMotion }) {
  const sectionRef = useRef(null)
  useGSAP(() => {
    if (reducedMotion) return
    gsap.fromTo('.story__statement > span > span', { yPercent: 105 }, {
      yPercent: 0, stagger: 0.1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.story__statement', start: 'top 82%', once: true },
    })
    gsap.fromTo('.venn circle', { strokeDashoffset: 1 }, {
      strokeDashoffset: 0, duration: 1.4, stagger: 0.25, ease: 'power2.inOut',
      scrollTrigger: { trigger: '.venn', start: 'top 80%', once: true },
    })
    gsap.fromTo('.story__annotation', { autoAlpha: 0, rotate: -10, x: -10 }, {
      autoAlpha: 1, rotate: -4, x: 0, duration: 0.6, delay: 0.9,
      scrollTrigger: { trigger: '.venn', start: 'top 80%', once: true },
    })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="paper story" id="studio" ref={sectionRef} aria-labelledby="story-title">
      <div className="paper__curl" aria-hidden="true" />
      <div className="story__masthead">
        <span>VOL. 01</span>
        <strong>The DevCore Gazette</strong>
        <span>PRICE: ONE GOOD CONVERSATION</span>
      </div>
      <p className="story__edition">STUDIO EDITION · WHAT WE BUILD · HOW WE THINK · WHY IT MATTERS</p>
      <h2 id="story-title" className="story__title reveal">Making Digital Products More Thoughtful, Useful, and Alive</h2>
      <div className="story__layout">
        <div className="story__columns reveal">
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
    </section>
  )
}

export function Convinced({ reducedMotion }) {
  const sectionRef = useRef(null)
  useGSAP(() => {
    if (reducedMotion) return
    gsap.timeline({ scrollTrigger: { trigger: '.wave-band', start: 'top bottom', end: 'bottom top', scrub: 0.4 } })
      .fromTo('#wave-turbulence', { attr: { baseFrequency: '0.002 0.06' } }, { attr: { baseFrequency: '0.01 0.002' }, ease: 'none' }, 0)
      .fromTo('#wave-displace', { attr: { scale: 140 } }, { attr: { scale: 10 }, ease: 'none' }, 0)
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="convinced" ref={sectionRef}>
      <svg width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="wave-filter">
          <feTurbulence id="wave-turbulence" type="fractalNoise" baseFrequency="0.004 0.04" numOctaves="1" seed="3" />
          <feDisplacementMap id="wave-displace" in="SourceGraphic" scale="80" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="convinced__copy">
        <h2 className="glow reveal">Still Not Convinced We&rsquo;re Serious About Software?</h2>
        <p className="reveal">We&rsquo;ve got one last trick up our sleeves.</p>
      </div>
      <div className="wave-band" aria-hidden="true"><div /></div>
    </section>
  )
}

export function Golden({ reducedMotion }) {
  const spinRef = useRef(0.6)
  return (
    <section className="golden">
      <div className="golden__beams" aria-hidden="true"><i /><i /><i /></div>
      <span className="golden__sign" aria-hidden="true">APPLAUSE</span>
      <h2 className="glow reveal">Check Out This Golden Floppy</h2>
      <p className="reveal">You made it this far. You deserve a save point.</p>
      <div className="golden-floppy">
        <button type="button" className="golden-floppy__hit" aria-label="Spin the golden floppy" onClick={() => { spinRef.current = 14 }} />
        <SceneMount
          className="golden-floppy__scene"
          scene={GoldenFloppyScene}
          spinRef={spinRef}
          reducedMotion={reducedMotion}
          fallback={<div className="golden-floppy__fallback" aria-hidden="true" />}
        />
      </div>
      <small>Click it. It spins. That&rsquo;s the whole trick.</small>
    </section>
  )
}

function RetroPhone() {
  return (
    <svg viewBox="0 0 120 120" className="retro-phone" aria-hidden="true">
      <rect x="14" y="58" width="92" height="46" rx="10" fill="#d9cdb5" />
      <rect x="22" y="66" width="76" height="30" rx="6" fill="#c3b69c" />
      <path d="M10 44c0-14 22-22 50-22s50 8 50 22v8c0 4-3 6-7 6H86c-4 0-6-2-6-6v-6H40v6c0 4-2 6-6 6H17c-4 0-7-2-7-6z" fill="#efe6d2" />
      {[0, 1, 2].map((row) => [0, 1, 2].map((col) => <rect key={`${row}${col}`} x={38 + col * 16} y={70 + row * 8} width="12" height="5" rx="1.5" fill="#2a2522" />))}
    </svg>
  )
}

export function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') || '').trim()
    const email = String(data.get('email') || '').trim()
    const message = String(data.get('message') || '').trim()
    const subject = encodeURIComponent(`Project enquiry from ${name}`)
    const body = encodeURIComponent(`${message}\n\n${name}\n${email}`)
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <section className="contact" id="contact" aria-labelledby="contact-heading">
      <div className="contact__spot" aria-hidden="true" />
      <p className="kicker reveal">Chapter 11 — Start a project</p>
      <h2 className="glow contact__title reveal" id="contact-heading" aria-label="Have a good one in mind?">
        <span aria-hidden="true"><span>Have a good one</span></span>
        <span aria-hidden="true"><span><em>in mind?</em></span></span>
      </h2>
      <p className="contact__lede reveal">Tell us what you&rsquo;re thinking about. We&rsquo;ll take it from there, thoughtfully and without the hard sell.</p>
      <div className="contact__cols">
        <div className="reveal">
          <h3>General Enquiries</h3>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <a href={`mailto:${EMAIL}?subject=Book%20a%20call`}>Book a call</a>
        </div>
        <form className="enquiry reveal" onSubmit={handleSubmit}>
          <div className="enquiry__bar"><span>ENQUIRY.TXT</span></div>
          <label htmlFor="enquiry-name">NAME<input id="enquiry-name" name="name" autoComplete="name" required /></label>
          <label htmlFor="enquiry-email">EMAIL<input id="enquiry-email" name="email" type="email" autoComplete="email" required /></label>
          <label htmlFor="enquiry-message">WHAT ARE YOU MAKING?<textarea id="enquiry-message" name="message" rows="3" required /></label>
          <button type="submit"><Mail size={15} /> Open email to send</button>
          <p aria-live="polite">{sent ? 'Your email app should open with the message ready. Nothing was sent automatically.' : 'This does not send anything by itself: it opens your email app with the message filled in. Nothing is stored here.'}</p>
        </form>
        <div className="reveal">
          <h3>On This Page</h3>
          <a href="#work">Case Files</a>
          <a href="#services">What We Build</a>
          <a href="#process">How We Work</a>
          <a href="#quality">The Fine Print</a>
        </div>
      </div>
      <div className="newbiz reveal">
        <RetroPhone />
        <div>
          <h3>New business</h3>
          <p>Reach out today for new project enquiries at <a href={`mailto:${EMAIL}?subject=New%20business`}>{EMAIL}</a></p>
        </div>
      </div>
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

import { useRef } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Orbit } from 'lucide-react'
import { services } from '../../data/services.data.js'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/* Project copy and concept visuals are carried over unchanged from the original Portfolio section. */
const projects = [
  {
    n: '01', category: 'Commerce · Concept study', title: 'A calmer way to shop.', bg: '#e4dfd2',
    description: 'A considered storefront concept for a modern independent brand.',
    visual: (
      <div className="work-visual commerce-visual">
        <div className="commerce-window">
          <div className="window-top"><span /><span /><span /><i>atelier / form</i></div>
          <div className="commerce-copy"><small>OBJECTS FOR SLOW LIVING</small><strong>Made for<br />the everyday.</strong><span>Discover the collection <ArrowRight size={13} /></span></div>
          <div className="product-shape"><div /></div>
          <div className="commerce-foot"><span>01 — 04</span><span>MATERIAL STUDY / 01</span></div>
        </div>
      </div>
    ),
  },
  {
    n: '02', category: 'AI workspace · Concept study', title: 'Knowledge, in motion.', bg: '#dcd8f0',
    description: 'An interface concept for turning scattered information into clear answers.',
    visual: (
      <div className="work-visual intelligence-visual">
        <div className="ai-window">
          <div className="ai-sidebar"><span className="ai-mark">d.</span><span className="ai-nav active">⌂</span><span className="ai-nav">◌</span><span className="ai-nav">▤</span><span className="ai-avatar">A</span></div>
          <div className="ai-content"><small>YOUR WORKSPACE <span>● CONNECTED</span></small><strong>Good morning, Alex.</strong><p>What would you like to find?</p><div className="ai-search"><Orbit size={14} /><span>Ask anything about your workspace...</span><ArrowUpRight size={13} /></div><div className="ai-sources"><i>NOTES</i><i>PROJECTS</i><i>DOCUMENTS</i></div><div className="ai-result"><span>✦</span><div><b>Suggested starting points</b><em>Three useful threads from your recent work</em></div><ArrowRight size={13} /></div></div>
        </div>
      </div>
    ),
  },
  {
    n: '03', category: 'Operations · Concept study', title: 'Every detail, in sync.', bg: '#d6dfd2',
    description: 'A unified operations dashboard concept for teams that keep things moving.',
    visual: (
      <div className="work-visual operations-visual">
        <div className="ops-window">
          <div className="ops-top"><span className="ops-logo">NORTH / FIELD</span><span>OVERVIEW / ACTIVITY / INVENTORY</span><i>● LIVE</i></div>
          <div className="ops-heading"><div><small>MONDAY, OCTOBER 27</small><strong>Operations overview</strong></div><span>All locations⌄</span></div>
          <div className="ops-stats"><div><small>ORDERS</small><b>Today&apos;s activity</b><span>Updated just now</span></div><div><small>INVENTORY</small><b>Stock overview</b><span>Across locations</span></div><div><small>TEAM</small><b>Shift coverage</b><span>Current schedule</span></div></div>
          <div className="ops-chart"><div><small>WEEKLY ACTIVITY</small><span>MON / TUE / WED / THU / FRI / SAT / SUN</span></div><div className="chart-bars">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div></div>
        </div>
      </div>
    ),
  },
  {
    n: '04', category: 'Product design · Concept study', title: 'Systems with a point of view.', bg: '#d3d9e8',
    description: 'A flexible visual language concept for a family of digital products.',
    visual: (
      <div className="work-visual design-system-visual">
        <div className="design-sheet">
          <div className="design-sheet-head"><span>FORM / 01</span><span>DESIGN LANGUAGE</span></div>
          <div className="design-statement">Make room<br /><i>for better.</i></div>
          <div className="design-marks"><span /><span /><span /><span /><span /><span /></div>
          <div className="design-sheet-foot"><span>TYPE / COLOR / MOTION</span><span>04 — 08</span></div>
        </div>
        <div className="design-chip design-chip-one">Aa</div>
        <div className="design-chip design-chip-two">01</div>
      </div>
    ),
  },
]

export function Hero({ motionState }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(() => {
    // Lets the 3D scene sleep once the hero has scrolled away.
    ScrollTrigger.create({
      trigger: ref.current, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { motionState.current.active = self.isActive },
    })
    if (reduced) return
    gsap.from('.lx-hero__word', { yPercent: 115, rotate: 3, duration: 1.3, stagger: 0.1, ease: 'power4.out', delay: 0.15 })
    gsap.fromTo('.lx-hero__meta, .lx-hero__cta', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.95, stagger: 0.1 })
    gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true } })
      .to(motionState.current, { progress: 1, ease: 'none' }, 0)
      .to('.lx-hero__title', { scale: 0.82, autoAlpha: 0, y: -90, ease: 'none', duration: 0.4 }, 0.15)
      .to('.lx-hero__cta, .lx-hero__meta', { autoAlpha: 0, duration: 0.1 }, 0.1)
      .fromTo('.lx-hero__reveal', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.3 }, 0.45)
  }, { scope: ref, dependencies: [reduced, motionState], revertOnUpdate: true })

  return (
    <section className="lx-hero" id="home" ref={ref}>
      <div className="lx-hero__stage">
        <h1 className="lx-hero__title" aria-label="We build software that feels alive.">
          {['We build', 'software that', 'feels alive.'].map((line) => (
            <span className="lx-mask" key={line}><span className="lx-hero__word">{line}</span></span>
          ))}
        </h1>
        <p className="lx-hero__reveal">Strategy, design, 3D and engineering — one small studio, end to end.</p>
        <a className="lx-pill lx-pill--light lx-hero__cta" href="#contact" data-cursor-label="SAY HELLO">Let’s talk <ArrowUpRight size={16} /></a>
        <div className="lx-hero__meta"><span>DEVCORE® / INDEPENDENT SOFTWARE STUDIO</span><a href="#about">SCROLL TO EXPLORE <ArrowDownRight size={14} /></a></div>
      </div>
    </section>
  )
}

export function Statement() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const text = 'We combine product thinking, design craft and engineering to make digital experiences that feel inevitable.'

  useGSAP(() => {
    if (reduced) return
    gsap.fromTo('.lx-word', { opacity: 0.14 }, {
      opacity: 1, stagger: 0.12, ease: 'none',
      scrollTrigger: { trigger: '.lx-statement__text', start: 'top 82%', end: 'bottom 48%', scrub: true },
    })
  }, { scope: ref, dependencies: [reduced], revertOnUpdate: true })

  return (
    <section className="lx-light lx-statement" id="about" ref={ref}>
      <p className="lx-kicker reveal">Bold ideas, built properly</p>
      <h2 className="lx-display lx-statement__text">
        {text.split(' ').map((word, index) => <span className="lx-word" key={index}>{word} </span>)}
      </h2>
      <div className="lx-statement__foot reveal">
        <p>We’re an independent software studio partnering with ambitious teams to turn complex ideas into useful, carefully made products.</p>
        <a className="lx-pill" href="#capabilities" data-cursor-label="EXPLORE">What we do <ArrowDownRight size={16} /></a>
      </div>
    </section>
  )
}

function Project({ project, reduced }) {
  const stage = useRef(null)
  const move = (event) => {
    const el = stage.current
    if (!el || reduced) return
    const r = el.getBoundingClientRect()
    const x = (event.clientX - r.left) / r.width
    const y = (event.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${x * 100}%`)
    el.style.setProperty('--my', `${y * 100}%`)
    el.style.setProperty('--ry', `${((x - 0.5) * 8).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`)
  }
  const leave = () => {
    stage.current?.style.setProperty('--ry', '0deg')
    stage.current?.style.setProperty('--rx', '0deg')
  }
  const id = `project-${project.n}`

  return (
    <article className="lx-proj" style={{ '--bg': project.bg }} aria-labelledby={id}>
      <div className="lx-proj__inner">
        <div className="lx-proj__meta">
          <span className="lx-proj__num" aria-hidden="true">{project.n}</span>
          <p className="lx-proj__cat">{project.category}</p>
          <h3 id={id}>{project.title}</h3>
          <p className="lx-proj__desc">{project.description}</p>
          <a className="lx-pill" href="#contact" data-cursor-label="DISCUSS">Discuss something similar <ArrowUpRight size={16} /></a>
        </div>
        <div className="lx-proj__stage" ref={stage} onPointerMove={move} onPointerLeave={leave} aria-hidden="true">
          <div className="lx-proj__tilt">{project.visual}</div>
          <span className="lx-proj__tag">DEVCORE / CONCEPT SERIES — {project.n} / 04</span>
        </div>
      </div>
    </article>
  )
}

export function Work() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(() => {
    if (reduced) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 761px)', () => {
      const panels = gsap.utils.toArray('.lx-proj', ref.current)
      panels.forEach((panel, index) => {
        gsap.fromTo(panel.querySelector('.lx-proj__stage'),
          { clipPath: 'inset(14% 10% 14% 10% round 28px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: panel, start: 'top 85%', end: 'top 15%', scrub: true } })
        gsap.fromTo(panel.querySelector('.lx-proj__num'), { yPercent: 25 }, {
          yPercent: -25, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true },
        })
        if (index < panels.length - 1) {
          gsap.to(panel.querySelector('.lx-proj__inner'), {
            scale: 0.9, opacity: 0.25, ease: 'none',
            scrollTrigger: { trigger: panels[index + 1], start: 'top bottom', end: 'top top', scrub: true },
          })
        }
      })
    })
    return () => mm.revert()
  }, { scope: ref, dependencies: [reduced], revertOnUpdate: true })

  return (
    <section className="lx-work" id="work" ref={ref}>
      <div className="lx-light lx-work__head">
        <p className="lx-kicker reveal">Featured work</p>
        <h2 className="lx-display reveal">Possibility, <em>made tangible.</em></h2>
        <p className="lx-note reveal">Four product directions imagined as concept studies — they show how we think and are not client commissions.</p>
      </div>
      {projects.map((project) => <Project project={project} reduced={reduced} key={project.n} />)}
    </section>
  )
}

export function Capabilities() {
  return (
    <section className="lx-light lx-caps" id="capabilities">
      <div className="lx-row-head reveal"><p className="lx-kicker">Capabilities</p><p className="lx-note">Six disciplines, one standard.</p></div>
      {services.map(({ number, icon: Icon, title, description, tags }) => (
        <article className="lx-cap reveal" key={number}>
          <span className="lx-cap__n">{number}</span>
          <h3>{title}</h3>
          <p>{description}</p>
          <ul>{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
          <Icon className="lx-cap__icon" size={30} strokeWidth={1.2} aria-hidden="true" />
        </article>
      ))}
    </section>
  )
}

export function Manifesto() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  useGSAP(() => {
    if (reduced) return
    gsap.fromTo('.lx-manifesto__line', { xPercent: (i) => (i % 2 ? -22 : 8) }, {
      xPercent: (i) => (i % 2 ? 8 : -22), ease: 'none',
      scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 1 },
    })
  }, { scope: ref, dependencies: [reduced], revertOnUpdate: true })

  return (
    <section className="lx-dark lx-manifesto" ref={ref} aria-label="Step into a new world and let your imagination run wild">
      <p className="lx-manifesto__line" aria-hidden="true">Step into a new world</p>
      <p className="lx-manifesto__line lx-outline" aria-hidden="true">and let your</p>
      <p className="lx-manifesto__line" aria-hidden="true">imagination run wild</p>
    </section>
  )
}

export function Closing() {
  return (
    <section className="lx-dark lx-closing" aria-labelledby="closing-title">
      <p className="lx-kicker">Is your big idea ready to go wild?</p>
      <h2 id="closing-title"><a className="lx-closing__cta" href="#contact" data-cursor-label="START">Let’s work<br />together!</a></h2>
      <div className="lx-marquee" aria-hidden="true">
        <div>{Array.from({ length: 8 }, (_, i) => <span key={i}>AVAILABLE FOR NEW PROJECTS —</span>)}</div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="lx-footer">
      <div className="lx-footer__cols">
        <div><span>General enquiries</span><a href="mailto:hello@devcore.studio">hello@devcore.studio</a></div>
        <nav aria-label="Footer"><a href="#work">Work</a><a href="#capabilities">Capabilities</a><a href="#contact">Contact</a></nav>
        <div><span>© {new Date().getFullYear()} DEVCORE STUDIO</span><a href="#home">Back to top ↑</a></div>
      </div>
      <p className="lx-footer__mark" aria-hidden="true">DEVCORE</p>
    </footer>
  )
}

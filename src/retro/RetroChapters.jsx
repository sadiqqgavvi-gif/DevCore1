import { lazy, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck, X } from 'lucide-react'
import AnimatedShaderHero from '../components/ui/AnimatedShaderHero.jsx'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap.js'
import {
  capabilities, caseFiles, EMAIL, labLayers, projects, qualityPrinciples,
} from './data.js'
import { DESKTOP_MOTION, MOBILE_LANDSCAPE, MOBILE_PORTRAIT, roomForPinnedScene, SCENE_SCRUB, SCENE_SNAP, scenePace } from './motionModes.js'
import { LogoMark } from './RetroChrome.jsx'
import SceneMount from './scenes/SceneMount.jsx'
import { scrollDepth } from './scrollDepth.js'

const PreludeScene = lazy(() => import('./scenes/PreludeScene.jsx'))
const AssemblerScene = lazy(() => import('./scenes/AssemblerScene.jsx'))


function useScrollProgress(sectionRef, progressRef) {
  useGSAP(() => {
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { progressRef.current = self.progress },
    })
  }, { scope: sectionRef })
}

/* ---------- A. Prelude: the DevCore universe ---------- */

const PRELUDE_BEATS = [
  <>Every product begins as a <em>loose idea.</em></>,
  <>We give it structure: architecture, systems, <em>a plan.</em></>,
  <>Then we give it life, with craft you can <em>feel.</em></>,
]

export function Prelude({ reducedMotion }) {
  const sectionRef = useRef(null)
  const progressRef = useRef(0)
  useScrollProgress(sectionRef, progressRef)

  useGSAP(() => {
    if (reducedMotion) return
    const tl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: SCENE_SCRUB } })
    gsap.utils.toArray('.prelude__beat').forEach((beat, index, all) => {
      // Beats hand over directly: one leaves as the next arrives, so the frame is never empty.
      const at = index * 0.33
      tl.fromTo(beat, { autoAlpha: 0, y: 50, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.09 }, Math.max(0, at - 0.03))
      if (index < all.length - 1) tl.to(beat, { autoAlpha: 0, y: -40, filter: 'blur(8px)', duration: 0.07 }, at + 0.26)
    })
    tl.fromTo('.prelude__meter i', { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: 1 }, 0)
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className={`prelude ${reducedMotion ? 'is-static' : ''}`} id="prelude" ref={sectionRef} aria-labelledby="prelude-title">
      <div className="prelude__stage">
        <SceneMount
          className="prelude__scene"
          scene={PreludeScene}
          progressRef={progressRef}
          reducedMotion={reducedMotion}
          fallback={<div className="prelude__fallback" aria-hidden="true"><i /><i /><i /></div>}
        />
        <div className="prelude__copy">
          <p className="kicker" id="prelude-title">Chapter 02 — The DevCore universe</p>
          {PRELUDE_BEATS.map((beat, index) => <p className="prelude__beat glow" key={index}>{beat}</p>)}
        </div>
        <div className="prelude__meter" aria-hidden="true"><i /></div>
      </div>
    </section>
  )
}

/* ---------- B. Case files ---------- */

function CaseVisual({ project }) {
  const [paper, mid, ink] = project.screen
  const style = { '--paper': paper, '--mid': mid, '--ink': ink }
  return (
    <div className={`case-visual case-visual--${project.glyph}`} style={style} aria-hidden="true">
      <div className="case-visual__bar"><i /><i /><i /><span>{project.title.toLowerCase().replace(/[^a-z]+/g, '-')}.concept</span></div>
      {project.glyph === 'shop' && (
        <div className="cv-shop">
          <div className="cv-shop__nav"><b>ATELIER/FORM</b><span>Objects</span><span>Journal</span><span>Bag (0)</span></div>
          <div className="cv-shop__hero"><div><small>OBJECTS FOR SLOW LIVING</small><strong>Made for the everyday.</strong><span className="cv-btn">Discover the collection</span></div><div className="cv-shop__object"><i /></div></div>
          <div className="cv-shop__row"><i /><i /><i /></div>
        </div>
      )}
      {project.glyph === 'orbit' && (
        <div className="cv-ai">
          <div className="cv-ai__side"><b>d.</b><i /><i /><i /></div>
          <div className="cv-ai__main"><small>YOUR WORKSPACE</small><strong>What would you like to find?</strong><div className="cv-ai__search">Ask anything about your workspace…</div><div className="cv-ai__chips"><span>NOTES</span><span>PROJECTS</span><span>DOCUMENTS</span></div><div className="cv-ai__answer"><span>✦</span><p>Three useful threads from your recent work<em>Sources: 3 documents</em></p></div></div>
        </div>
      )}
      {project.glyph === 'bars' && (
        <div className="cv-ops">
          <div className="cv-ops__head"><strong>Operations overview</strong><span>All locations ⌄</span></div>
          <div className="cv-ops__tiles"><div><small>ORDERS</small><b>Today</b></div><div><small>INVENTORY</small><b>Stock</b></div><div><small>TEAM</small><b>Shifts</b></div></div>
          <div className="cv-ops__chart">{Array.from({ length: 14 }, (_, index) => <i key={index} style={{ '--h': `${30 + ((index * 37) % 60)}%` }} />)}</div>
        </div>
      )}
      {project.glyph === 'grid' && (
        <div className="cv-ds">
          <div className="cv-ds__type"><b>Aa</b><span>Display / Text / Mono</span></div>
          <div className="cv-ds__swatches"><i /><i /><i /><i /><i /></div>
          <div className="cv-ds__components"><span className="cv-btn">Primary</span><span className="cv-btn cv-btn--ghost">Secondary</span><span className="cv-toggle"><i /></span></div>
          <div className="cv-ds__tokens"><span>space.4</span><span>radius.2</span><span>motion.ease-out</span></div>
        </div>
      )}
    </div>
  )
}

function CaseDialog({ index, onClose }) {
  const dialogRef = useRef(null)
  const project = projects[index]
  const file = caseFiles[index]

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  return (
    <dialog className="case-dialog" ref={dialogRef} aria-labelledby="case-dialog-title" onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close() }}>
      <div className="case-dialog__inner">
        <div className="case-dialog__bar"><span>CASE_FILE_{project.number}.TXT</span><button type="button" onClick={() => dialogRef.current.close()} aria-label="Close case file"><X size={16} /></button></div>
        <div className="case-dialog__body">
          <p className="kicker">{project.kicker}</p>
          <h3 id="case-dialog-title">{project.title}</h3>
          <p className="case-dialog__line">{project.description}</p>
          <dl>
            <div><dt>The brief</dt><dd>{file.brief}</dd></div>
            <div><dt>Our approach</dt><dd>{file.approach}</dd></div>
            <div><dt>Explored features</dt><dd><ul>{file.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></dd></div>
            <div><dt>Disciplines</dt><dd className="chips">{file.disciplines.map((item) => <span key={item}>{item}</span>)}</dd></div>
            <div><dt>Status</dt><dd>Concept study. This is not a client commission, so there is no live demo, repository or outcome to report.</dd></div>
          </dl>
          <a className="button-cream" href={`mailto:${EMAIL}?subject=${encodeURIComponent(`A project like ${project.title}`)}`}>Discuss something similar <ArrowUpRight size={15} /></a>
        </div>
      </div>
    </dialog>
  )
}


const clamp01 = (value) => Math.min(1, Math.max(0, value))
const smooth = (from, to, value) => {
  const t = clamp01((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}
const mix = (a, b, t) => a + (b - a) * t

// Works wheel timeline, as shares of the pinned scroll: the files hold as a ring, fold into a
// vertical drum, turn through each file, then the drum steps back for the closing panel.
const WHEEL_RING_END = 0.1
const WHEEL_DRUM_START = 0.24
const WHEEL_DRUM_END = 0.84
const WHEEL_STEP = 36
const WHEEL_SCREENS = 3.6

export function CaseFiles() {
  const sectionRef = useRef(null)
  const triggerRef = useRef(null)
  const pointsRef = useRef([])
  const panelRef = useRef(0)
  const [openIndex, setOpenIndex] = useState(null)
  // 0 = intro panel, 1..n = case files, n + 1 = outro panel.
  const [panel, setPanel] = useState(0)

  useGSAP(() => {
    const section = sectionRef.current
    const cases = gsap.utils.toArray('.case', section)
    const visuals = cases.map((card) => card.querySelector('.case-visual'))
    const intro = section.querySelector('.cases__intro')
    const outro = section.querySelector('.cases__outro')
    // Written every frame, so only on the two elements that use it, not the whole section.
    const progressEls = [section.querySelector('.cases__hud'), section.querySelector('.cases__progress')]
    const count = cases.length
    const mm = gsap.matchMedia()

    const setPanelIndex = (next) => {
      if (next === panelRef.current) return
      panelRef.current = next
      setPanel(next)
    }

    // Desktop: the Works wheel. Pinned for a fixed distance; native scrolling drives it.
    const wheel = () => {
      section.classList.add('is-wheel')
      const stops = [0, ...cases.map((_, index) => WHEEL_DRUM_START + (index / (count - 1)) * (WHEEL_DRUM_END - WHEEL_DRUM_START)), 1]
      pointsRef.current = stops
      let geo = null
      const measure = () => {
        const stage = section.querySelector('.cases__stage').getBoundingClientRect()
        const cardW = visuals[0].offsetWidth
        const cardH = visuals[0].offsetHeight
        geo = { ring: Math.min(stage.height * 0.36, stage.width * 0.34), drum: cardH * 1.25, cardW, cardH }
      }
      const render = (p) => {
        if (!geo) measure()
        const morph = smooth(WHEEL_RING_END, WHEEL_DRUM_START, p)
        const turn = gsap.utils.clamp(0, 1, (p - WHEEL_DRUM_START) / (WHEEL_DRUM_END - WHEEL_DRUM_START)) * (count - 1)
        const recede = smooth(WHEEL_DRUM_END, 1, p)
        const spin = p * 40
        visuals.forEach((visual, index) => {
          // Ring position: evenly spaced, slowly turning while the intro reads.
          const angle = ((index / count) * 360 - 90 + spin) * (Math.PI / 180)
          const ringX = Math.cos(angle) * geo.ring
          const ringY = Math.sin(angle) * geo.ring
          // Drum position: each file sits on a cylinder turning around the horizontal axis.
          const theta = (index - turn) * WHEEL_STEP
          const rad = theta * (Math.PI / 180)
          const drumY = Math.sin(rad) * geo.drum
          const drumZ = (Math.cos(rad) - 1) * geo.drum
          const x = mix(ringX, 0, morph)
          const y = mix(ringY, drumY, morph)
          const z = mix(0, drumZ, morph) - recede * 160
          const rotateX = mix(0, -theta, morph)
          const facing = Math.cos(Math.min(Math.abs(rad), Math.PI / 2))
          // Files off the front swing a few degrees and sit slightly smaller, so the drum reads
          // as depth rather than a flat list.
          const rotateY = mix(0, Math.sin(Math.max(-1, Math.min(1, rad))) * -9, morph)
          const scale = mix(0.46, 1, morph) * mix(1, 0.93 + 0.07 * facing, morph) * (1 - recede * 0.12)
          const opacity = mix(0.95, Math.max(0, facing * 1.15 - 0.15), morph) * (1 - recede * 0.55)
          visual.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`
          visual.style.opacity = opacity.toFixed(3)
          visual.style.zIndex = String(Math.round(100 + mix(index, facing * 50, morph)))
        })
        intro.style.opacity = (1 - smooth(WHEEL_RING_END, WHEEL_RING_END + 0.08, p)).toFixed(3)
        progressEls.forEach((element) => element.style.setProperty('--cases-progress', p.toFixed(3)))
        // The copy beside the drum follows the file in front.
        const active = p < (WHEEL_RING_END + WHEEL_DRUM_START) / 2 ? 0 : p > (WHEEL_DRUM_END + 1) / 2 ? count + 1 : Math.round(turn) + 1
        cases.forEach((card, index) => card.classList.toggle('is-active', active === index + 1))
        outro.classList.toggle('is-active', active === count + 1)
        setPanelIndex(active)
      }
      const state = { p: 0 }
      const tween = gsap.to(state, {
        p: 1,
        ease: 'none',
        onUpdate: () => render(state.p),
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * WHEEL_SCREENS * scenePace())}`,
          pin: true,
          scrub: SCENE_SCRUB,
          invalidateOnRefresh: true,
          onRefresh: () => { measure(); render(state.p) },
          snap: { ...SCENE_SNAP, snapTo: stops },
        },
      })
      triggerRef.current = tween.scrollTrigger
      measure()
      render(0)
      return () => {
        section.classList.remove('is-wheel')
        cases.forEach((card) => card.classList.remove('is-active'))
        outro.classList.remove('is-active')
        visuals.forEach((visual) => visual.removeAttribute('style'))
        intro.style.removeProperty('opacity')
        progressEls.forEach((element) => element.style.removeProperty('--cases-progress'))
        triggerRef.current = null
      }
    }

    // Tablets, phones and short screens: a stacked list. Each file rises in as it arrives and
    // settles back as it leaves, tied to the scroll position. Tablets get a gentle 3D tilt;
    // phones only translate, scale and fade, over shorter distances.
    const stacked = (light) => {
      const copies = cases.map((card) => card.querySelector('.case__copy'))
      const lift = light ? 34 : 64
      const shrink = light ? 0.04 : 0.06
      const tilt = light ? 0 : 10
      scrollDepth(cases, (index, enter, exit) => {
        const away = 1 - enter
        const visual = visuals[index]
        visual.style.transform = `translate3d(0, ${(away * lift - exit * lift * 0.5).toFixed(1)}px, 0)${tilt ? ` rotateX(${(away * tilt - exit * tilt * 0.6).toFixed(2)}deg)` : ''} scale(${(1 - away * shrink - exit * shrink * 0.6).toFixed(4)})`
        visual.style.opacity = (1 - away * 0.6 - exit * 0.35).toFixed(3)
        copies[index].style.transform = `translate3d(0, ${(away * lift * 0.5 - exit * lift * 0.25).toFixed(1)}px, 0)`
        copies[index].style.opacity = (1 - away * 0.8 - exit * 0.3).toFixed(3)
      })
      return () => [...visuals, ...copies].forEach((element) => {
        element.style.removeProperty('transform')
        element.style.removeProperty('opacity')
      })
    }

    mm.add(DESKTOP_MOTION, () => (roomForPinnedScene() ? wheel() : stacked(false)))
    // Phones and tablets (portrait) run the same wheel; CSS stacks the drum above the copy.
    mm.add(MOBILE_PORTRAIT, wheel)
    mm.add(MOBILE_LANDSCAPE, () => stacked(true))
    return () => mm.revert()
  }, { scope: sectionRef })

  const scrollToStop = (index, behavior) => {
    const st = triggerRef.current
    if (!st) return false
    window.scrollTo({ top: st.start + (st.end - st.start) * (pointsRef.current[index] ?? 0), behavior })
    return true
  }

  const goToPanel = (index) => {
    const target = gsap.utils.clamp(1, projects.length, index)
    if (!scrollToStop(target, 'smooth')) document.getElementById(`case-${projects[target - 1].number}`)?.scrollIntoView({ block: 'center' })
  }

  // Keyboard focus inside a file that is not in front turns the wheel to that file.
  const followFocus = (index) => {
    if (index !== panelRef.current) scrollToStop(index, 'auto')
  }

  const current = panel >= 1 && panel <= projects.length ? projects[panel - 1] : null

  return (
    <section className="cases" id="work" ref={sectionRef} aria-labelledby="cases-title">
      <div className="cases__hud" role="group" aria-label="Case file navigation">
        <button type="button" onClick={() => goToPanel(panel - 1)} disabled={panel <= 1} aria-label="Previous case file"><ArrowLeft size={16} /></button>
        <div className="cases__hud-info" aria-live="polite">
          <span>{current ? `${current.number} / 0${projects.length}` : panel === 0 ? `00 / 0${projects.length}` : 'NEXT'}</span>
          <strong>{current ? current.title : panel === 0 ? 'Case Files' : 'Your project'}</strong>
        </div>
        <button type="button" onClick={() => goToPanel(panel + 1)} disabled={panel >= projects.length} aria-label="Next case file"><ArrowRight size={16} /></button>
      </div>
      <div className="cases__track">
        <div className="cases__stage" aria-hidden="true" />
        <header className="cases__intro">
          <p className="kicker">Chapter 03 — Selected work</p>
          <h2 id="cases-title" className="glow">Case Files</h2>
          <p>Four product directions, explored as concept studies. They show how we think. They are not client commissions, and we label them that way.</p>
          <span className="cases__hint" aria-hidden="true">Keep scrolling <ArrowDown size={14} /></span>
        </header>
        {projects.map((project, index) => (
          <article className="case" key={project.number} aria-labelledby={`case-${project.number}`} onFocus={() => followFocus(index + 1)}>
            <CaseVisual project={project} />
            <div className="case__copy">
              <p className="kicker">{project.number} / 0{projects.length} — {project.kicker}</p>
              <h3 id={`case-${project.number}`}>{project.title}</h3>
              <p className="case__line">{project.line}</p>
              <p>{caseFiles[index].brief}</p>
              <ul className="chips">{caseFiles[index].disciplines.map((item) => <li key={item}>{item}</li>)}</ul>
              <button type="button" className="button-cream" onClick={() => setOpenIndex(index)}>Open case file <ArrowUpRight size={15} /></button>
            </div>
          </article>
        ))}
        <aside className="cases__outro">
          <span className="cases__stamp">FILE 05</span>
          <h3>Have a real one?</h3>
          <p>The next file could be yours: a genuine brief, built for real people.</p>
          <a className="button-cream" href="#start">Start a project <ArrowRight size={15} /></a>
        </aside>
      </div>
      <div className="cases__progress" aria-hidden="true"><i /></div>
      {openIndex !== null && <CaseDialog index={openIndex} onClose={() => setOpenIndex(null)} />}
    </section>
  )
}

/* ---------- C. What we build ---------- */

function CapabilityArt({ type }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, pathLength: 1, className: 'cap-art__draw' }
  return (
    <svg className={`cap-art cap-art--${type}`} viewBox="0 0 200 160" aria-hidden="true">
      {type === 'window' && <><rect x="20" y="20" width="160" height="120" rx="8" {...common} /><path d="M20 44h160M32 32h.01M42 32h.01M52 32h.01M40 64h70M40 82h120M40 100h96M40 118h50" {...common} /></>}
      {type === 'orbit' && <><ellipse cx="100" cy="80" rx="80" ry="28" {...common} /><ellipse cx="100" cy="80" rx="80" ry="28" transform="rotate(60 100 80)" {...common} /><ellipse cx="100" cy="80" rx="80" ry="28" transform="rotate(-60 100 80)" {...common} /><circle cx="100" cy="80" r="12" {...common} /></>}
      {type === 'nodes' && <><path d="M30 120 80 50l50 60 40-70M80 50l90-10M30 120h140" {...common} />{[[30, 120], [80, 50], [130, 110], [170, 40], [170, 120]].map(([cx, cy]) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="8" {...common} />)}</>}
      {type === 'spark' && <><path d="M100 20c6 34 26 54 60 60-34 6-54 26-60 60-6-34-26-54-60-60 34-6 54-26 60-60Z" {...common} /><path d="M160 24c2 10 8 16 18 18-10 2-16 8-18 18-2-10-8-16-18-18 10-2 16-8 18-18Z" {...common} /></>}
      {type === 'bag' && <><path d="M44 56h112l-10 84H54Z" {...common} /><path d="M72 56c0-36 56-36 56 0M70 96h60" {...common} /></>}
      {type === 'stack' && <><path d="m100 20 80 30-80 30-80-30Z" {...common} /><path d="m20 80 80 30 80-30M20 110l80 30 80-30" {...common} /></>}
    </svg>
  )
}

export function Capabilities({ reducedMotion }) {
  const sectionRef = useRef(null)
  useGSAP(() => {
    // The row in the middle of the screen is lit (a state, so it applies with reduced motion too).
    gsap.utils.toArray('.cap', sectionRef.current).forEach((row) => {
      ScrollTrigger.create({ trigger: row, start: 'top 50%', end: 'bottom 50%', toggleClass: 'is-active' })
    })
    if (reducedMotion) return
    gsap.utils.toArray('.cap', sectionRef.current).forEach((row, index) => {
      // Rows swing up out of depth, alternating the side they hinge from.
      gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 82%', once: true } })
        .fromTo(row, { rotateX: 14, rotateY: index % 2 ? -6 : 6, z: -120, autoAlpha: 0, transformPerspective: 1400, transformOrigin: index % 2 ? '100% 0%' : '0% 0%' }, { rotateX: 0, rotateY: 0, z: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' })
        .fromTo(row.querySelector('.cap__title'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut' }, 0.15)
        .fromTo(row.querySelectorAll('.cap-art__draw'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, stagger: 0.08, ease: 'power2.out' }, 0.15)
        .fromTo(row.querySelectorAll('.cap__value, .cap__list li'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05 }, 0.35)
      // Each drawing keeps turning slowly while its row crosses the screen, alternating direction.
      gsap.fromTo(row.querySelector('.cap-art'), { y: 40, rotate: row.classList.contains('cap--flip') ? -8 : 8 }, {
        y: -40, rotate: row.classList.contains('cap--flip') ? 6 : -6, ease: 'none',
        scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      })
      gsap.fromTo(row.querySelector('.cap__num'), { y: 30 }, { y: -30, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 0.8 } })
    })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="caps zone" id="services" ref={sectionRef} aria-labelledby="caps-title">
      <div className="zone__fallback zone__fallback--grid" aria-hidden="true" />
      <header className="caps__head">
        <p className="kicker">Chapter 05 — Capabilities</p>
        <h2 id="caps-title">What We <em>Build</em></h2>
        <p>Six kinds of work we take on, and what each one is actually for.</p>
      </header>
      <ol className="caps__list">
        {capabilities.map((cap, index) => (
          <li className={`cap ${index % 2 ? 'cap--flip' : ''}`} key={cap.title}>
            <span className="cap__num" aria-hidden="true">0{index + 1}</span>
            <h3 className="cap__title">{cap.title}</h3>
            <CapabilityArt type={cap.art} />
            <div className="cap__body">
              <p className="cap__value">{cap.value}</p>
              <ul className="cap__list">{cap.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </li>
        ))}
      </ol>
      <div className="zone__handoff" aria-hidden="true" />
    </section>
  )
}

/* ---------- D. The engineering lab ---------- */

const CODE_ROWS = [62, 38, 80, 54, 24, 70, 46]

// Progress at which each layer is centred within the pinned sequence.
const LAB_STOPS = labLayers.map((_, index) => (index + 0.5) / labLayers.length)

export function Lab() {
  const sectionRef = useRef(null)
  const triggerRef = useRef(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    const section = sectionRef.current
    const mm = gsap.matchMedia()
    const plates = () => gsap.utils.toArray('.lab-plate', section)
    // Gap per layer. The fully separated desktop stack scales with viewport height so its top
    // plate never rises under the nav on shorter screens (re-evaluated on refresh).
    const lift = (gap) => (index, _target, all) => `${(all.length - 1 - index) * (typeof gap === 'function' ? gap() : gap)}px`
    const separated = () => Math.min(110, window.innerHeight * 0.085)

    const pinned = (compact) => {
      section.classList.add('is-pinned')
      section.classList.toggle('is-compact', compact)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * (compact ? 1.3 : 1.6) * scenePace())}`,
          pin: true,
          scrub: SCENE_SCRUB,
          invalidateOnRefresh: true,
          snap: { ...SCENE_SNAP, snapTo: [0, ...LAB_STOPS, 1], directional: false },
          onUpdate: (self) => {
            const next = Math.min(labLayers.length - 1, Math.floor(self.progress * labLayers.length))
            if (next !== activeRef.current) {
              activeRef.current = next
              setActive(next)
            }
          },
        },
      })
      triggerRef.current = tl.scrollTrigger
      // The stack separates in the first third, then turns slowly as each layer is introduced.
      tl.fromTo(plates(), { '--lift': lift(compact ? 8 : 18) }, { '--lift': lift(compact ? 40 : separated), ease: 'power2.inOut', duration: 0.35 }, 0)
        .fromTo('.lab__stack', { '--tilt': '62deg', '--spin': '-48deg' }, { '--tilt': compact ? '56deg' : '52deg', '--spin': '-28deg', ease: 'none', duration: 1 }, 0)
        .fromTo('.lab-plate__code span', { scaleX: 0 }, { scaleX: 1, stagger: 0.004, duration: 0.3 }, 0.08)
        .fromTo('.lab__copy > *', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.03, duration: 0.12 }, 0)
      return () => {
        section.classList.remove('is-pinned', 'is-compact')
        triggerRef.current = null
      }
    }

    // Landscape phones: no pin. The stack separates as it passes through the viewport.
    const passing = () => {
      gsap.fromTo(plates(), { '--lift': lift(10) }, {
        '--lift': lift(60), ease: 'none',
        scrollTrigger: { trigger: '.lab__visual', start: 'top 85%', end: 'bottom 40%', scrub: 0.5 },
      })
    }

    mm.add(DESKTOP_MOTION, () => pinned(false))
    mm.add(MOBILE_PORTRAIT, () => (roomForPinnedScene() ? pinned(true) : passing()))
    mm.add(MOBILE_LANDSCAPE, passing)
    return () => mm.revert()
  }, { scope: sectionRef })

  // A tab tap moves the scroll position to that layer, so the stack, tabs and panel stay in step.
  const selectLayer = (index) => {
    const st = triggerRef.current
    if (!st) {
      activeRef.current = index
      setActive(index)
      return
    }
    window.scrollTo({ top: st.start + (st.end - st.start) * LAB_STOPS[index], behavior: 'smooth' })
  }

  const layer = labLayers[active]

  return (
    <section className="lab" id="lab" ref={sectionRef} aria-labelledby="lab-title">
      <div className="lab__grid">
        <div className="lab__visual" aria-hidden="true">
          <div className="lab__stack">
            {labLayers.map((item, index) => (
              <div className={`lab-plate lab-plate--${item.id} ${index === active ? 'is-active' : ''}`} key={item.id} style={{ '--i': index, zIndex: labLayers.length - index }}>
                <span className="lab-plate__name">{String(index + 1).padStart(2, '0')} {item.name}</span>
                <div className="lab-plate__code">{CODE_ROWS.map((width, row) => <span key={row} style={{ width: `${(width + index * 11) % 85 + 12}%` }} />)}</div>
              </div>
            ))}
          </div>
          <p className="lab__note">Illustration. Not live code or real system metrics.</p>
        </div>
        <div className="lab__copy">
          <p className="kicker">Chapter 06 — The engineering lab</p>
          <h2 id="lab-title" className="glow">From Idea to <em>Working Software</em></h2>
          <p className="lab__lede">Every product we build is a stack of layers that have to work together. Here is how we think about each one.</p>
          <div className="lab__tabs" role="tablist" aria-label="Architecture layers">
            {labLayers.map((item, index) => (
              <button key={item.id} type="button" role="tab" id={`lab-tab-${item.id}`} aria-selected={index === active} aria-controls="lab-panel" tabIndex={index === active ? 0 : -1} onClick={() => selectLayer(index)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                  event.preventDefault()
                  const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1
                  const next = (index + step + labLayers.length) % labLayers.length
                  selectLayer(next)
                  event.currentTarget.parentElement.children[next].focus()
                }}
              >
                <span>0{index + 1}</span>{item.name}
              </button>
            ))}
          </div>
          <div className="lab__panel" role="tabpanel" id="lab-panel" aria-labelledby={`lab-tab-${layer.id}`} key={layer.id}>
            <h3>{layer.tagline}</h3>
            <p>{layer.detail}</p>
            <ul className="chips">{layer.tech.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- F. How we work: see ProcessFlow.jsx ---------- */

/* ---------- G. Quality & reliability ---------- */

// The six commitments stay on the page, one click away, with the original footnote.
const FINE_PRINT_FOOTNOTE = '* Principles describe how we work. They are not claims of formal certification or regulatory compliance.'

export function Quality() {
  return (
    <AnimatedShaderHero
      id="quality"
      className="quality-hero"
      headingId="quality-title"
      eyebrow="Chapter 09 — Quality & reliability"
      trustBadge={{ text: 'Engineered with intent', icon: <ShieldCheck size={16} strokeWidth={2.2} /> }}
      headline={{ line1: 'Quality Is', line2: 'Built In.' }}
      subtitle="Reliable systems, deliberate engineering, and thoughtful validation — built to perform beyond the first release."
      buttons={{
        primary: { text: 'Start a Project', href: '#start' },
        secondary: { text: 'Our Approach', href: '#process' },
      }}
    >
      <details className="fine-print ash-fade-up ash-delay-800">
        <summary>Read the fine print <span aria-hidden="true">· six commitments</span></summary>
        <ul className="fine-print__list">
          {qualityPrinciples.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.means}</span>
              <small>{item.practice}</small>
            </li>
          ))}
        </ul>
        <p className="fine-print__foot">{FINE_PRINT_FOOTNOTE}</p>
      </details>
    </AnimatedShaderHero>
  )
}

/* ---------- I. Signature 3D moment: the assembler ---------- */

const ASSEMBLY_BEATS = [
  ['01', 'Scattered requirements.', 'Every project starts as a cloud of needs, ideas and constraints.'],
  ['02', 'Structured into modules.', 'We sort them into parts that can be designed, built and tested on their own.'],
  ['03', 'One coherent system.', 'Then everything locks together into a product that holds its shape.'],
]

export function Assembler({ reducedMotion }) {
  const sectionRef = useRef(null)
  const progressRef = useRef(0)
  useScrollProgress(sectionRef, progressRef)

  useGSAP(() => {
    if (reducedMotion) return
    const tl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: SCENE_SCRUB } })
    gsap.utils.toArray('.assembler__beat').forEach((beat, index, all) => {
      const at = index * 0.3
      tl.fromTo(beat, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.08 }, at + 0.02)
      if (index < all.length - 1) tl.to(beat, { autoAlpha: 0.18, duration: 0.08 }, at + 0.26)
    })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className={`assembler ${reducedMotion ? 'is-static' : ''}`} id="assembler" ref={sectionRef} aria-labelledby="assembler-title">
      <div className="assembler__stage">
        <SceneMount
          className="assembler__scene"
          scene={AssemblerScene}
          progressRef={progressRef}
          reducedMotion={reducedMotion}
          fallback={<div className="assembler__fallback" aria-hidden="true"><LogoMark size={180} /></div>}
        />
        <div className="assembler__copy">
          <p className="kicker">Chapter 10 — The assembler</p>
          <h2 id="assembler-title" className="glow">From Scattered Parts to <em>One System</em></h2>
          <ol>
            {ASSEMBLY_BEATS.map(([num, title, text]) => (
              <li className="assembler__beat" key={num}><span>{num}</span><div><strong>{title}</strong><p>{text}</p></div></li>
            ))}
          </ol>
          <p className="assembler__caption">216 modules, one core. Move your pointer to inspect it.</p>
        </div>
      </div>
    </section>
  )
}

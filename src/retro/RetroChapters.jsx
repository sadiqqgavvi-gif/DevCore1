import { Fragment, lazy, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap.js'
import {
  capabilities, caseFiles, EMAIL, labLayers, processStages, projects, qualityPrinciples, techGroups, tools,
} from './data.js'
import { OPEN_CASE_EVENT } from './events.js'
import { DESKTOP_MOTION, MOBILE_LANDSCAPE, MOBILE_PORTRAIT, PROCESS_FLOW, PROCESS_PINNED, roomForPinnedScene } from './motionModes.js'
import { LogoMark } from './RetroChrome.jsx'
import SceneMount from './scenes/SceneMount.jsx'

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
    const tl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
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


const nearestIndex = (points, value) => points.reduce((best, point, index) => (Math.abs(point - value) < Math.abs(points[best] - value) ? index : best), 0)

export function CaseFiles() {
  const sectionRef = useRef(null)
  const triggerRef = useRef(null)
  const pointsRef = useRef([])
  const panelRef = useRef(0)
  const [openIndex, setOpenIndex] = useState(null)
  // 0 = intro panel, 1..n = case files, n + 1 = outro panel.
  const [panel, setPanel] = useState(0)

  useEffect(() => {
    const open = (event) => setOpenIndex(event.detail)
    window.addEventListener(OPEN_CASE_EVENT, open)
    return () => window.removeEventListener(OPEN_CASE_EVENT, open)
  }, [])

  useGSAP(() => {
    const section = sectionRef.current
    const track = section.querySelector('.cases__track')
    const mm = gsap.matchMedia()

    // Desktop and tall phones share the pinned horizontal journey; only its scale and
    // movement distances change. The layout class is applied before anything is measured.
    const horizontal = (compact) => {
      section.classList.add('is-hscroll')
      section.classList.toggle('is-compact', compact)
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
      // Progress at which each panel is centred: used for snapping, the HUD and the buttons.
      const measure = () => {
        const d = distance() || 1
        pointsRef.current = Array.from(track.children, (child) => gsap.utils.clamp(0, 1, (child.offsetLeft + child.offsetWidth / 2 - window.innerWidth / 2) / d))
      }
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance() * (compact ? 1.15 : 1)}`,
          pin: true,
          scrub: compact ? 0.5 : 0.7,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
          snap: { snapTo: (value, self) => pointsRef.current[nearestIndex(pointsRef.current, self?.progress ?? value)] ?? value, inertia: false, duration: { min: 0.2, max: 0.55 }, delay: 0.1, ease: 'power2.out' },
          onUpdate: (self) => {
            section.style.setProperty('--cases-progress', self.progress.toFixed(3))
            const next = nearestIndex(pointsRef.current, self.progress)
            if (next !== panelRef.current) {
              panelRef.current = next
              setPanel(next)
            }
          },
        },
      })
      triggerRef.current = slide.scrollTrigger
      measure()

      const tilt = compact ? 0.5 : 1
      gsap.utils.toArray('.case', section).forEach((card) => {
        const sweep = { trigger: card, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true }
        gsap.fromTo(card.querySelector('.case-visual'),
          { rotateY: 16 * tilt, rotateX: 4 * tilt, scale: 0.9, z: -60 * tilt },
          { rotateY: -12 * tilt, rotateX: -2 * tilt, scale: 1, z: 0, ease: 'none', scrollTrigger: sweep })
        // Copy arrives a beat after the visual, line by line, then holds while the card is centred.
        gsap.fromTo(card.querySelectorAll('.case__copy > *'),
          { x: 70 * tilt, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.05, ease: 'power2.out', scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left 85%', end: 'left 30%', scrub: true } })
      })
      return () => {
        section.classList.remove('is-hscroll', 'is-compact')
        triggerRef.current = null
      }
    }

    // Short or landscape phones: a pinned card would not fit, so each file gets its own entrance.
    const stacked = () => {
      gsap.utils.toArray('.case', section).forEach((card) => {
        gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 80%', once: true } })
          .fromTo(card.querySelector('.case-visual'), { rotateX: 18, y: 40, autoAlpha: 0 }, { rotateX: 0, y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' })
          .fromTo(card.querySelectorAll('.case__copy > *'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5 }, 0.2)
      })
    }

    mm.add(DESKTOP_MOTION, () => horizontal(false))
    mm.add(MOBILE_PORTRAIT, () => (roomForPinnedScene() ? horizontal(true) : stacked()))
    mm.add(MOBILE_LANDSCAPE, stacked)
    return () => mm.revert()
  }, { scope: sectionRef })

  const goToPanel = (index) => {
    const st = triggerRef.current
    const target = gsap.utils.clamp(1, projects.length, index)
    if (!st) {
      document.getElementById(`case-${projects[target - 1].number}`)?.scrollIntoView({ block: 'center' })
      return
    }
    window.scrollTo({ top: st.start + (st.end - st.start) * (pointsRef.current[target] ?? 0), behavior: 'smooth' })
  }

  // Keyboard focus inside an off-screen card moves the journey to that card.
  const followFocus = (index) => {
    const st = triggerRef.current
    sectionRef.current.scrollLeft = 0
    if (!st || index === panelRef.current) return
    window.scrollTo({ top: st.start + (st.end - st.start) * (pointsRef.current[index] ?? 0), behavior: 'auto' })
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
        <header className="cases__intro">
          <p className="kicker">Chapter 03 — Selected work</p>
          <h2 id="cases-title" className="glow">Case Files</h2>
          <p>Four product directions, explored as concept studies. They show how we think. They are not client commissions, and we label them that way.</p>
          <span className="cases__hint" aria-hidden="true">Keep scrolling <ArrowRight size={14} /></span>
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
          <a className="button-cream" href="#contact">Start a project <ArrowRight size={15} /></a>
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
          end: compact ? '+=130%' : '+=160%',
          pin: true,
          scrub: compact ? 0.4 : 0.6,
          invalidateOnRefresh: true,
          snap: { snapTo: [0, ...LAB_STOPS, 1], directional: false, inertia: false, duration: { min: 0.2, max: 0.5 }, delay: 0.1, ease: 'power2.out' },
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

/* ---------- E. Technology ecosystem ---------- */

const wordmarkStyle = Object.fromEntries(tools.map((tool) => [tool.name, tool.style]))

export function Ecosystem({ reducedMotion }) {
  const sectionRef = useRef(null)
  useGSAP(() => {
    const section = sectionRef.current
    // The band being read lights its node on the spine (a state, kept with reduced motion).
    gsap.utils.toArray('.eco__band', section).forEach((band) => {
      ScrollTrigger.create({ trigger: band, start: 'top 50%', end: 'bottom 50%', toggleClass: 'is-active' })
    })
    if (reducedMotion) return
    gsap.to('.eco__orbit', { rotate: 120, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 } })
    // The spine that connects the layers fills as the ecosystem is read.
    gsap.fromTo('.eco__spine i', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.eco__bands', start: 'top 65%', end: 'bottom 55%', scrub: 0.6 } })
    gsap.fromTo('.eco__core', { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 20%', scrub: 0.8 } })
    gsap.utils.toArray('.eco__band', section).forEach((band, index) => {
      gsap.timeline({ scrollTrigger: { trigger: band, start: 'top 84%', once: true } })
        .fromTo(band, { z: -140, rotateX: 18, autoAlpha: 0, transformPerspective: 1200 }, { z: 0, rotateX: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' })
        // Wordmark cards flip up like split-flap characters, one after another.
        .fromTo(band.querySelectorAll('.wordmark'), { rotateX: -90, autoAlpha: 0, transformPerspective: 500 }, {
          rotateX: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6, ease: 'back.out(1.8)',
        }, 0.2)
      gsap.fromTo(band.querySelector('.eco__marks'), { x: index % 2 ? 50 : -50 }, { x: 0, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'top 55%', scrub: 0.6 } })
    })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="eco zone" id="technology" ref={sectionRef} aria-labelledby="eco-title">
      <div className="zone__fallback zone__fallback--constellation" aria-hidden="true" />
      <div className="eco__core" aria-hidden="true" />
      <svg className="eco__orbit" viewBox="0 0 400 400" aria-hidden="true">
        <circle cx="200" cy="200" r="190" /><circle cx="200" cy="200" r="140" /><circle cx="200" cy="200" r="90" />
        <circle className="eco__planet" cx="200" cy="10" r="7" /><circle className="eco__planet" cx="340" cy="200" r="5" /><circle className="eco__planet" cx="200" cy="290" r="6" />
      </svg>
      <span className="showcase__stamp showcase__stamp--left" aria-hidden="true">CHOSEN<br />TO FIT<br />THE JOB</span>
      <span className="showcase__stamp showcase__stamp--right" aria-hidden="true">NOT<br />BY<br />HABIT</span>
      <p className="kicker">Chapter 07 — Technology ecosystem</p>
      <h2 id="eco-title" className="glow reveal">A Showcase of Trusted Tools</h2>
      <p className="showcase__lede reveal">A well-chosen toolbox, organised by the job each tool does. We pick what fits the product, not the trend.</p>
      <div className="eco__bands">
        <span className="eco__spine" aria-hidden="true"><i /></span>
        {techGroups.map((group) => (
          <div className="eco__band" key={group.category}>
            <span className="eco__node" aria-hidden="true" />
            <div className="eco__label"><span>{group.category}</span><em>{group.title}</em></div>
            <ul className="eco__marks">{group.items.map((item) => <li key={item} className={`wordmark ${wordmarkStyle[item] || ''}`}>{item}</li>)}</ul>
            <p className="eco__role">{group.role}</p>
          </div>
        ))}
      </div>
      <div className="zone__handoff" aria-hidden="true" />
    </section>
  )
}

/* ---------- F. How we work: a ring of stages that becomes a workflow drum ---------- */

// Scroll choreography, as fractions of the pinned distance.
const RING_END = 0.15 // the ring has fully folded into the drum
const DRUM_START = 0.18 // stage 1 faces the viewer
const DRUM_SPAN = 0.7 // stage 6 faces the viewer at DRUM_START + DRUM_SPAN
const SETTLE_START = 0.92 // the drum settles back before the pin releases
const STEP_DEG = 40 // angle between neighbouring stages on the drum
const HEAD_TOP_SCALE = 0.58 // the heading's size once it has risen above the drum
const LAST_STAGE = processStages.length - 1
const STAGE_STOPS = processStages.map((_, index) => DRUM_START + (index / LAST_STAGE) * DRUM_SPAN)
const D2R = Math.PI / 180

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const smooth = (from, to, value) => {
  const t = clamp01((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}
const mix = (a, b, t) => a + (b - a) * t

function StageCard({ stage, index, active }) {
  return (
    <article className={`drum-card ${active ? 'is-active' : ''}`} aria-labelledby={`stage-${index}`}>
      <span className="drum-card__node" aria-hidden="true" />
      <div className="drum-card__bar" aria-hidden="true"><span>STAGE_0{index + 1}</span><span>{stage.command}</span><i /><i /></div>
      <div className="drum-card__body">
        <p className="drum-card__prompt" aria-hidden="true">C:\DEVCORE&gt; RUN {stage.command}</p>
        <h3 id={`stage-${index}`}><span className="drum-card__num">0{index + 1}</span> {stage.title}</h3>
        <p className="drum-card__happens">{stage.happens}</p>
        <dl>
          <div><dt>You get</dt><dd>{stage.youGet}</dd></div>
          <div><dt>Your role</dt><dd>{stage.yourRole}</dd></div>
        </dl>
      </div>
      <span className="drum-card__shade" aria-hidden="true" />
    </article>
  )
}

export function ProcessTimeline() {
  const sectionRef = useRef(null)
  const triggerRef = useRef(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    const section = sectionRef.current
    const cards = gsap.utils.toArray('.drum-card', section)
    const mm = gsap.matchMedia()
    const activate = (next) => {
      if (next === activeRef.current) return
      activeRef.current = next
      setActive(next)
    }

    // Phones, tablets and short screens: the same cards in normal document flow. Each tilts
    // up out of depth as it arrives, holds flat while it is read, and leans away as it leaves.
    const flow = () => {
      cards.forEach((card, index) => {
        gsap.timeline({ scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
          .fromTo(card, { rotateX: 16, z: -90, opacity: 0.35, transformPerspective: 1100, transformOrigin: '50% 50%' }, { rotateX: 0, z: 0, opacity: 1, ease: 'power2.out', duration: 0.36 })
          .to(card, { rotateX: 0, duration: 0.28 })
          .to(card, { rotateX: -10, z: -50, opacity: 0.6, ease: 'power1.in', duration: 0.36 })
        ScrollTrigger.create({ trigger: card, start: 'top 50%', end: 'bottom 50%', onToggle: (self) => { if (self.isActive) activate(index) } })
      })
      ScrollTrigger.create({
        trigger: section.querySelector('.drum'),
        start: 'top 60%',
        end: 'bottom 60%',
        onUpdate: (self) => section.style.setProperty('--pt-progress', self.progress.toFixed(3)),
      })
    }

    // Tall desktops: the pinned ring → drum sequence. One scrubbed progress value drives every
    // transform; React only hears about it when the active stage changes.
    const drum = () => {
      section.classList.add('is-drum')
      const head = section.querySelector('.pt__head')
      const index = section.querySelector('.pt__index')
      const halo = section.querySelector('.drum__halo')
      const geo = {}

      const measure = () => {
        const stageW = section.clientWidth
        const stageH = section.clientHeight
        const navH = document.querySelector('.nav')?.offsetHeight || 76
        const headH = head.offsetHeight
        const drumTop = navH + 14 + headH * HEAD_TOP_SCALE + 10
        const gutter = parseFloat(getComputedStyle(section).getPropertyValue('--gutter')) || 0.05 * stageW
        // The drum layer spans the whole stage (so the ring is never clipped); cards are anchored
        // at the centre of the area right of the stage index and below the risen heading.
        const areaLeft = gutter + 300
        const areaW = stageW - areaLeft - gutter
        const areaH = stageH - drumTop - stageH * 0.03
        const anchorX = areaLeft + areaW / 2
        const anchorY = drumTop + areaH / 2
        section.style.setProperty('--drum-top', `${Math.round(drumTop)}px`)
        section.style.setProperty('--drum-cx', `${Math.round(anchorX)}px`)
        section.style.setProperty('--drum-cy', `${Math.round(anchorY)}px`)
        section.style.setProperty('--drum-card-w', `${Math.round(Math.min(640, areaW - 20))}px`)
        // Every card shares the tallest card's height so the drum is a true cylinder.
        section.style.removeProperty('--drum-card-h')
        const cardH = Math.max(...cards.map((card) => card.offsetHeight))
        const cardW = cards[0].offsetWidth
        section.style.setProperty('--drum-card-h', `${cardH}px`)
        geo.cx = anchorX - stageW / 2
        geo.cy = anchorY - stageH / 2
        geo.fitScale = Math.min(1, (areaH - 16) / cardH)
        // Radius chosen so neighbouring cards meet just clear of the active card's edges.
        geo.radius = (cardH / 2 + 28) / Math.tan((STEP_DEG / 2) * D2R)
        geo.headTopY = -stageH / 2 + navH + 14 + (headH * HEAD_TOP_SCALE) / 2
        geo.rx = Math.min(stageW * 0.36, 560)
        geo.ry = Math.min(stageH * 0.31, 290)
        geo.ringScale = Math.min(0.42, (geo.ry * 0.72) / cardH, (geo.rx * 0.62) / cardW)
        geo.ring = processStages.map((_, i) => {
          const phi = (-120 + i * 60) * D2R
          return { x: Math.cos(phi) * geo.rx, y: Math.sin(phi) * geo.ry, phi }
        })
        halo.setAttribute('viewBox', `${-stageW / 2} ${-stageH / 2} ${stageW} ${stageH}`)
        halo.querySelector('polygon').setAttribute('points', geo.ring.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' '))
        // Faint orbits behind the heading and a glowing marker at each stage's place on the ring.
        const [outer, inner] = halo.querySelectorAll('.drum__orbit')
        outer.setAttribute('r', (geo.ry * 0.82).toFixed(1))
        inner.setAttribute('r', (geo.ry * 0.56).toFixed(1))
        halo.querySelectorAll('.drum__marker').forEach((marker, i) => {
          marker.setAttribute('cx', geo.ring[i].x.toFixed(1))
          marker.setAttribute('cy', geo.ring[i].y.toFixed(1))
        })
        geo.fits = geo.fitScale > 0.86
      }

      const render = (p) => {
        const fold = smooth(0.02, RING_END, p)
        const s = clamp01((p - DRUM_START) / DRUM_SPAN) * LAST_STAGE
        const settle = smooth(SETTLE_START, 1, p)
        cards.forEach((card, i) => {
          // Cards fold out of the ring one after another, not all at once.
          const t = clamp01(fold * 1.45 - i * 0.08)
          const ring = geo.ring[i]
          const angle = (i - s) * STEP_DEG
          const away = Math.abs(angle)
          const x = mix(ring.x - geo.cx, 0, t)
          const y = mix(ring.y - geo.cy, geo.radius * Math.sin(angle * D2R), t)
          const z = mix(-40, geo.radius * Math.cos(angle * D2R) - geo.radius - settle * 180, t)
          const rotateX = mix(Math.sin(ring.phi) * -10, -angle - settle * 6, t)
          const rotateY = mix(Math.cos(ring.phi) * 16, 0, t)
          const scale = mix(geo.ringScale, geo.fitScale * (1 - settle * 0.06), t)
          const drumOpacity = away > 92 ? 0 : clamp01(1 - (away - STEP_DEG * 0.6) / (STEP_DEG * 1.5))
          const opacity = mix(0.94, drumOpacity * (1 - settle * (i === LAST_STAGE ? 0.1 : 0.4)), t)
          card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`
          card.style.opacity = opacity.toFixed(3)
          card.style.zIndex = String(Math.round(200 - mix(0, away, t)))
          card.style.setProperty('--shade', mix(0.15, clamp01(away / STEP_DEG) * 0.72, t).toFixed(3))
          card.style.visibility = opacity < 0.02 ? 'hidden' : 'visible'
        })
        head.style.transform = `translate(-50%, -50%) translate3d(0, ${mix(0, geo.headTopY, fold).toFixed(1)}px, 0) scale(${mix(1, HEAD_TOP_SCALE, fold).toFixed(3)})`
        index.style.opacity = fold.toFixed(3)
        index.style.transform = `translateX(${mix(-40, 0, fold).toFixed(1)}px)`
        index.style.visibility = fold < 0.02 ? 'hidden' : 'visible'
        section.style.setProperty('--ring', (1 - fold).toFixed(3))
        section.style.setProperty('--pt-progress', (s / LAST_STAGE).toFixed(3))
        activate(Math.round(s))
      }

      measure()
      // Guard: if the stage cannot fit at a comfortable size, use the normal-flow sequence.
      if (!geo.fits) {
        section.classList.remove('is-drum')
        section.style.removeProperty('--drum-card-h')
        flow()
        return undefined
      }

      const proxy = { p: 0 }
      const tween = gsap.to(proxy, {
        p: 1,
        ease: 'none',
        onUpdate: () => render(proxy.p),
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          // Ring fold + ~45vh per stage + a short settle: long enough to read, never a trap.
          end: `+=${processStages.length * 45 + 80}%`,
          pin: true,
          scrub: 0.55,
          invalidateOnRefresh: true,
          snap: { snapTo: [0, ...STAGE_STOPS, 1], directional: false, inertia: false, duration: { min: 0.25, max: 0.6 }, delay: 0.12, ease: 'power2.inOut' },
          onRefresh: () => {
            measure()
            render(proxy.p)
          },
        },
      })
      triggerRef.current = tween.scrollTrigger
      render(0)

      return () => {
        triggerRef.current = null
        section.classList.remove('is-drum')
        ;['--drum-top', '--drum-cx', '--drum-cy', '--drum-card-w', '--drum-card-h', '--ring', '--pt-progress'].forEach((name) => section.style.removeProperty(name))
        ;[...cards, head, index].forEach((element) => {
          element.style.removeProperty('transform')
          element.style.removeProperty('opacity')
          element.style.removeProperty('visibility')
          element.style.removeProperty('z-index')
          element.style.removeProperty('--shade')
        })
      }
    }

    mm.add(PROCESS_PINNED, drum)
    mm.add(PROCESS_FLOW, flow)
    return () => mm.revert()
  }, { scope: sectionRef })

  // Stage indicators scroll the sequence to that stage, so card, text and path move together.
  const select = (index) => {
    const st = triggerRef.current
    if (st) {
      window.scrollTo({ top: st.start + (st.end - st.start) * STAGE_STOPS[index], behavior: 'smooth' })
      return
    }
    sectionRef.current.querySelectorAll('.drum-card')[index]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const onIndexKey = (event, index) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, Home: -index, End: LAST_STAGE - index }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = Math.min(LAST_STAGE, Math.max(0, index + keys[event.key]))
    select(next)
    event.currentTarget.closest('ol').querySelectorAll('button')[next]?.focus()
  }

  return (
    <section className="process pt zone" id="process" ref={sectionRef} aria-labelledby="process-title">
      <div className="pt__floor" aria-hidden="true" />
      <svg className="drum__halo" aria-hidden="true">
        <circle className="drum__orbit" cx="0" cy="0" />
        <circle className="drum__orbit drum__orbit--inner" cx="0" cy="0" />
        <polygon />
        {processStages.map((stage) => <circle key={stage.title} className="drum__marker" r="4" />)}
      </svg>
      <header className="pt__head">
        <p className="kicker">Chapter 08 — How we work</p>
        <h2 id="process-title" className="glow">How We Work</h2>
        <p className="process__lede">Six stages, in order, every time. Written for the people we build with, not just for developers.</p>
      </header>
      <nav className="pt__index" aria-label="Workflow stages">
        <span className="pt__rail" aria-hidden="true"><i /></span>
        <ol>
          {processStages.map((stage, index) => (
            <li key={stage.title} className={index === active ? 'is-active' : index < active ? 'is-done' : ''}>
              <button type="button" onClick={() => select(index)} onKeyDown={(event) => onIndexKey(event, index)} aria-current={index === active ? 'step' : undefined}>
                <span className="pt__node" aria-hidden="true" />
                <span className="pt__num">0{index + 1}</span>
                <span className="pt__title">{stage.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="drum">
        {processStages.map((stage, index) => <StageCard key={stage.title} stage={stage} index={index} active={index === active} />)}
      </div>
      <p className="visually-hidden" aria-live="polite">Stage {active + 1} of {processStages.length}: {processStages[active].title}</p>
    </section>
  )
}

/* ---------- G. Quality & reliability ---------- */

// Copy that belongs to The Fine Print itself (kept word for word from the original chart).
const FINE_PRINT_INTRO = 'Six commitments we hold ourselves to on every project. They are working principles, not certifications.'
const FINE_PRINT_FOOTNOTE = '* Principles describe how we work. They are not claims of formal certification or regulatory compliance.'
const TYPING_MS = 520

// Six-segment calibration ring: each commitment lights its segment once it has been inspected.
function VerificationRing({ inspected }) {
  const segments = qualityPrinciples.map((_, index) => {
    const from = (index * 60 - 90 + 3) * (Math.PI / 180)
    const to = ((index + 1) * 60 - 90 - 3) * (Math.PI / 180)
    const r = 92
    return `M ${(100 + r * Math.cos(from)).toFixed(2)} ${(100 + r * Math.sin(from)).toFixed(2)} A ${r} ${r} 0 0 1 ${(100 + r * Math.cos(to)).toFixed(2)} ${(100 + r * Math.sin(to)).toFixed(2)}`
  })
  return (
    <div className="fp-ring" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        {Array.from({ length: 60 }, (_, index) => {
          const a = (index / 60) * Math.PI * 2
          const inner = index % 5 === 0 ? 72 : 76
          return <line key={index} className="fp-ring__tick" x1={100 + Math.cos(a) * inner} y1={100 + Math.sin(a) * inner} x2={100 + Math.cos(a) * 80} y2={100 + Math.sin(a) * 80} />
        })}
        <circle className="fp-ring__track" cx="100" cy="100" r="92" />
        {segments.map((d, index) => <path key={index} className={`fp-ring__seg ${inspected.has(index) ? 'is-on' : ''}`} d={d} />)}
        <circle className="fp-ring__core" cx="100" cy="100" r="52" />
      </svg>
      <div className="fp-ring__label"><strong>{inspected.size}/{qualityPrinciples.length}</strong><span>INSPECTED</span></div>
    </div>
  )
}

export function Quality({ reducedMotion }) {
  const sectionRef = useRef(null)
  const panelRef = useRef(null)
  const logRef = useRef(null)
  // The conversation is just the list of commitments the visitor has asked about, in order.
  const [asked, setAsked] = useState([])
  const [typing, setTyping] = useState(false)
  const inspected = new Set(asked)
  const complete = inspected.size === qualityPrinciples.length

  useGSAP(() => {
    if (reducedMotion) return
    const section = sectionRef.current
    // Entrance: the heading first, then the calibration ring, then the terminal rises into place.
    gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 75%', once: true } })
      .fromTo('.fp-head > *', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' })
      .fromTo('.fp-ring', { scale: 0.85, rotate: -30, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' }, 0.15)
      .fromTo('.fp-terminal', { y: 50, rotateX: 10, z: -80, autoAlpha: 0, transformPerspective: 1400, transformOrigin: '50% 0%' }, { y: 0, rotateX: 0, z: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' }, 0.25)
    // Hand-off: the stage recedes into the dark as the Assembler takes over.
    gsap.fromTo('.fp-stage', { z: 0, rotateX: 0, autoAlpha: 1, transformPerspective: 1600, transformOrigin: '50% 100%' }, {
      z: -160, rotateX: 8, autoAlpha: 0.3, ease: 'none',
      scrollTrigger: { trigger: section, start: 'bottom 80%', end: 'bottom top', scrub: 0.8 },
    })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  // Spotlight: a soft light follows the pointer across the terminal, eased so it never jitters.
  // Scoped to the panel; skipped on touch screens and with reduced motion.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel || reducedMotion || !window.matchMedia('(pointer: fine)').matches) return undefined
    const target = { x: 0.5, y: 0.2 }
    const current = { ...target }
    let frame = 0
    const step = () => {
      current.x += (target.x - current.x) * 0.12
      current.y += (target.y - current.y) * 0.12
      panel.style.setProperty('--spot-x', `${(current.x * 100).toFixed(2)}%`)
      panel.style.setProperty('--spot-y', `${(current.y * 100).toFixed(2)}%`)
      frame = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.001 ? window.requestAnimationFrame(step) : 0
    }
    const move = (event) => {
      const rect = panel.getBoundingClientRect()
      target.x = (event.clientX - rect.left) / rect.width
      target.y = (event.clientY - rect.top) / rect.height
      panel.style.setProperty('--spot-o', '1')
      if (!frame) frame = window.requestAnimationFrame(step)
    }
    const leave = () => panel.style.setProperty('--spot-o', '0')
    panel.addEventListener('pointermove', move)
    panel.addEventListener('pointerleave', leave)
    return () => {
      window.cancelAnimationFrame(frame)
      panel.removeEventListener('pointermove', move)
      panel.removeEventListener('pointerleave', leave)
    }
  }, [reducedMotion])

  // New messages scroll the log, never the page, and never move keyboard focus.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [asked, typing, reducedMotion])

  // The typing indicator re-arms whenever it is shown, so it can never be left stuck on.
  useEffect(() => {
    if (!typing) return undefined
    const timer = window.setTimeout(() => setTyping(false), TYPING_MS)
    return () => window.clearTimeout(timer)
  }, [typing, asked.length])

  const ask = (index) => {
    if (typing) return
    setAsked((list) => [...list, index])
    if (!reducedMotion) setTyping(true)
  }
  const nextIndex = qualityPrinciples.findIndex((_, index) => !inspected.has(index))
  const back = () => {
    if (asked.length === 0) return
    setTyping(false)
    setAsked((list) => list.slice(0, -1))
  }
  const reset = () => {
    setTyping(false)
    setAsked([])
  }

  return (
    <section className="quality zone" id="quality" ref={sectionRef} aria-labelledby="quality-title">
      <div className="zone__fallback zone__fallback--rings" aria-hidden="true" />
      <div className="fp-stage">
        <div className="fp-side">
          <header className="fp-head">
            <p className="kicker">Chapter 09 — Quality &amp; reliability</p>
            <h2 id="quality-title" className="glow">The Fine Print</h2>
            <p className="fp-head__intro">{FINE_PRINT_INTRO}</p>
            <p className="fp-status" aria-hidden="true"><i /> QA TERMINAL · READY</p>
          </header>
          <VerificationRing inspected={inspected} />
        </div>

        <div className="fp-terminal" ref={panelRef} role="region" aria-label="The Fine Print terminal">
          <span className="fp-terminal__spot" aria-hidden="true" />
          <div className="fp-terminal__bar">
            <LogoMark size={18} />
            <span>DEVCORE · QA TERMINAL</span>
            <span className="fp-terminal__state"><i aria-hidden="true" /> ready</span>
          </div>
          <div className="fp-progress" aria-hidden="true"><i style={{ transform: `scaleX(${inspected.size / qualityPrinciples.length})` }} /></div>
          <ol className="fp-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation">
            <li className="fp-msg fp-msg--devcore"><span className="fp-msg__who">DEVCORE</span><p>Before we build anything, here is the fine print.</p></li>
            <li className="fp-msg fp-msg--devcore"><span className="fp-msg__who">DEVCORE</span><p>{FINE_PRINT_INTRO}</p><p className="fp-msg__hint">Pick one to inspect, or step through them in order.</p></li>
            {asked.map((index, turn) => {
              const item = qualityPrinciples[index]
              const pending = typing && turn === asked.length - 1
              return (
                <Fragment key={turn}>
                  <li className="fp-msg fp-msg--visitor"><span className="fp-msg__who">YOU</span><p>Tell me about {item.title.toLowerCase()}.</p></li>
                  {pending ? (
                    <li className="fp-msg fp-msg--devcore fp-msg--typing" aria-hidden="true"><span className="fp-msg__who">DEVCORE</span><span className="fp-dots"><i /><i /><i /></span></li>
                  ) : (
                    <li className="fp-msg fp-msg--devcore fp-msg--answer">
                      <span className="fp-msg__who">DEVCORE · {String(index + 1).padStart(2, '0')}/{String(qualityPrinciples.length).padStart(2, '0')}</span>
                      <h3>{item.title}</h3>
                      <dl>
                        <div><dt>What it means for you</dt><dd>{item.means}</dd></div>
                        <div><dt>How we practise it</dt><dd>{item.practice}</dd></div>
                      </dl>
                      <span className="fp-msg__logged" aria-hidden="true">✓ Logged</span>
                    </li>
                  )}
                </Fragment>
              )
            })}
            {complete && !typing && (
              <li className="fp-msg fp-msg--devcore fp-msg--close">
                <span className="fp-msg__who">DEVCORE</span>
                <p>That&rsquo;s all six. {FINE_PRINT_FOOTNOTE}</p>
                <a className="button-cream" href="#contact">Start a project <ArrowRight size={15} /></a>
              </li>
            )}
          </ol>
          <div className="fp-input">
            <div className="fp-chips" role="group" aria-label="Choose a commitment to inspect">
              {qualityPrinciples.map((item, index) => (
                <button key={item.title} type="button" className={`fp-chip ${inspected.has(index) ? 'is-done' : ''}`} onClick={() => ask(index)} aria-disabled={typing}
                  aria-label={inspected.has(index) ? `${item.title} (inspected)` : item.title}>
                  <span aria-hidden="true">{inspected.has(index) ? '✓' : String(index + 1).padStart(2, '0')}</span>{item.title}
                </button>
              ))}
            </div>
            {/* aria-disabled rather than disabled, and one primary button whose job changes,
                so keyboard focus is never dropped while DevCore "types" or the flow completes. */}
            <div className="fp-controls">
              <button type="button" className="fp-ghost" onClick={back} aria-disabled={asked.length === 0}><ArrowLeft size={15} /> Back</button>
              <button type="button" className={complete ? 'fp-ghost' : 'fp-send'} onClick={complete ? reset : () => ask(nextIndex)} aria-disabled={typing}>
                {complete ? 'Start over' : <>{asked.length === 0 ? 'Step through' : 'Next'} <ArrowRight size={15} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <details className="fp-all">
        <summary>View the complete checklist</summary>
        <div className="spec-table" role="table" aria-label="Engineering principles">
          <div className="spec-row spec-row--head" role="row">
            <span role="columnheader">Principle</span>
            <span role="columnheader">What it means for you</span>
            <span role="columnheader">How we practise it</span>
          </div>
          {qualityPrinciples.map((item) => (
            <div className="spec-row" role="row" key={item.title}>
              <strong role="cell">{item.title}</strong>
              <span role="cell">{item.means}</span>
              <span role="cell">{item.practice}</span>
            </div>
          ))}
        </div>
        <p className="fp-all__foot">{FINE_PRINT_FOOTNOTE}</p>
      </details>
      <div className="zone__handoff zone__handoff--assembler" aria-hidden="true" />
    </section>
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
    const tl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.5 } })
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

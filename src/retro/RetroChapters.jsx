import { lazy, useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, X } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap.js'
import {
  capabilities, caseFiles, EMAIL, labLayers, processStages, projects, qualityPrinciples, techGroups, tools,
} from './data.js'
import { LogoMark } from './RetroChrome.jsx'
import SceneMount from './scenes/SceneMount.jsx'

const PreludeScene = lazy(() => import('./scenes/PreludeScene.jsx'))
const AssemblerScene = lazy(() => import('./scenes/AssemblerScene.jsx'))

import { OPEN_CASE_EVENT } from './events.js'
const DESKTOP_MOTION = '(min-width: 900px) and (prefers-reduced-motion: no-preference)'

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

export function CaseFiles() {
  const sectionRef = useRef(null)
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    const open = (event) => setOpenIndex(event.detail)
    window.addEventListener(OPEN_CASE_EVENT, open)
    return () => window.removeEventListener(OPEN_CASE_EVENT, open)
  }, [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(DESKTOP_MOTION, () => {
      const track = sectionRef.current.querySelector('.cases__track')
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.7, invalidateOnRefresh: true },
      })
      gsap.utils.toArray('.case-visual', sectionRef.current).forEach((visual) => {
        gsap.fromTo(visual, { rotateY: 16, rotateX: 4, scale: 0.9 }, {
          rotateY: -12, rotateX: -2, scale: 1, ease: 'none',
          scrollTrigger: { trigger: visual.closest('.case'), containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
        })
      })
      gsap.to('.cases__progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: () => `+=${distance()}`, scrub: true } })
    })
    return () => mm.revert()
  }, { scope: sectionRef })

  return (
    <section className="cases" id="work" ref={sectionRef} aria-labelledby="cases-title">
      <div className="cases__track">
        <header className="cases__intro">
          <p className="kicker">Chapter 03 — Selected work</p>
          <h2 id="cases-title" className="glow">Case Files</h2>
          <p>Four product directions, explored as concept studies. They show how we think. They are not client commissions, and we label them that way.</p>
          <span className="cases__hint" aria-hidden="true">Keep scrolling <ArrowRight size={14} /></span>
        </header>
        {projects.map((project, index) => (
          <article className="case" key={project.number} aria-labelledby={`case-${project.number}`}>
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
    if (reducedMotion) return
    gsap.utils.toArray('.cap').forEach((row) => {
      gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 78%', once: true } })
        .fromTo(row.querySelector('.cap__title'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut' })
        .fromTo(row.querySelectorAll('.cap-art__draw'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, stagger: 0.08, ease: 'power2.out' }, 0.15)
        .fromTo(row.querySelectorAll('.cap__value, .cap__list li'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05 }, 0.35)
    })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="caps" id="services" ref={sectionRef} aria-labelledby="caps-title">
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
    </section>
  )
}

/* ---------- D. The engineering lab ---------- */

const CODE_ROWS = [62, 38, 80, 54, 24, 70, 46]

export function Lab() {
  const sectionRef = useRef(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(DESKTOP_MOTION, () => {
      const plates = gsap.utils.toArray('.lab-plate')
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => {
            const next = Math.min(labLayers.length - 1, Math.floor(self.progress * labLayers.length))
            if (next !== activeRef.current) {
              activeRef.current = next
              setActive(next)
            }
          },
        },
      })
      tl.fromTo(plates, { '--lift': (index) => `${(plates.length - 1 - index) * 18}px` }, { '--lift': (index) => `${(plates.length - 1 - index) * 110}px`, ease: 'power2.inOut', duration: 0.5 }, 0)
        .fromTo('.lab__stack', { rotateZ: -45 }, { rotateZ: -30, ease: 'none', duration: 1 }, 0)
        .fromTo('.lab-plate__code span', { scaleX: 0 }, { scaleX: 1, stagger: 0.004, duration: 0.3 }, 0.1)
    })
    return () => mm.revert()
  }, { scope: sectionRef })

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
              <button key={item.id} type="button" role="tab" id={`lab-tab-${item.id}`} aria-selected={index === active} aria-controls="lab-panel" tabIndex={index === active ? 0 : -1} onClick={() => setActive(index)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                  event.preventDefault()
                  const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1
                  const next = (index + step + labLayers.length) % labLayers.length
                  setActive(next)
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
    if (reducedMotion) return
    gsap.to('.eco__orbit', { rotate: 120, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 1 } })
    gsap.utils.toArray('.eco__band').forEach((band, index) => {
      gsap.fromTo(band.querySelector('.eco__marks'), { x: index % 2 ? 60 : -60 }, { x: 0, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'top 55%', scrub: 0.6 } })
    })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="paper eco" id="technology" ref={sectionRef} aria-labelledby="eco-title">
      <svg className="eco__orbit" viewBox="0 0 400 400" aria-hidden="true">
        <circle cx="200" cy="200" r="190" /><circle cx="200" cy="200" r="140" /><circle cx="200" cy="200" r="90" />
        <circle className="eco__planet" cx="200" cy="10" r="7" /><circle className="eco__planet" cx="340" cy="200" r="5" /><circle className="eco__planet" cx="200" cy="290" r="6" />
      </svg>
      <span className="showcase__stamp showcase__stamp--left" aria-hidden="true">CHOSEN<br />TO FIT<br />THE JOB</span>
      <span className="showcase__stamp showcase__stamp--right" aria-hidden="true">NOT<br />BY<br />HABIT</span>
      <p className="kicker">Chapter 07 — Technology ecosystem</p>
      <h2 id="eco-title" className="reveal">A Showcase of Trusted Tools</h2>
      <p className="showcase__lede reveal">A well-chosen toolbox, organised by the job each tool does. We pick what fits the product, not the trend.</p>
      <div className="eco__bands">
        {techGroups.map((group) => (
          <div className="eco__band reveal" key={group.category}>
            <div className="eco__label"><span>{group.category}</span><em>{group.title}</em></div>
            <ul className="eco__marks">{group.items.map((item) => <li key={item} className={`wordmark ${wordmarkStyle[item] || ''}`}>{item}</li>)}</ul>
            <p className="eco__role">{group.role}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- F. How we work ---------- */

function TerminalState({ stage, index }) {
  const filled = Math.round(((index + 1) / processStages.length) * 18)
  return (
    <div className="pt-state" key={index}>
      <p className="dos__prompt">C:\DEVCORE&gt; RUN {stage.command}</p>
      <p className="pt-state__title">&gt; STAGE 0{index + 1} OF 0{processStages.length} — {stage.title.toUpperCase()}</p>
      <dl>
        <div><dt>WHAT HAPPENS</dt><dd>{stage.happens}</dd></div>
        <div><dt>YOU GET</dt><dd>{stage.youGet}</dd></div>
        <div><dt>YOUR ROLE</dt><dd>{stage.yourRole}</dd></div>
      </dl>
      <p className="pt-state__bar" aria-hidden="true">[{'█'.repeat(filled)}{'░'.repeat(18 - filled)}] {index + 1}/{processStages.length}</p>
      <p className="dos__prompt">C:\DEVCORE&gt; <span className="dos__cursor">_</span></p>
    </div>
  )
}

export function ProcessTimeline() {
  const sectionRef = useRef(null)
  const triggerRef = useRef(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(DESKTOP_MOTION, () => {
      triggerRef.current = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: `+=${processStages.length * 55}%`,
        pin: true,
        onUpdate: (self) => {
          sectionRef.current.style.setProperty('--pt-progress', self.progress.toFixed(3))
          const next = Math.min(processStages.length - 1, Math.floor(self.progress * processStages.length))
          if (next !== activeRef.current) {
            activeRef.current = next
            setActive(next)
          }
        },
      })
      return () => { triggerRef.current = null }
    })
    return () => mm.revert()
  }, { scope: sectionRef })

  const select = (index) => {
    const st = triggerRef.current
    if (!st) {
      setActive(index)
      return
    }
    window.scrollTo({ top: st.start + (st.end - st.start) * ((index + 0.5) / processStages.length), behavior: 'smooth' })
  }

  return (
    <section className="process pt" id="process" ref={sectionRef} aria-labelledby="process-title">
      <header className="pt__head">
        <p className="kicker">Chapter 08 — How we work</p>
        <h2 id="process-title" className="glow">How We Work</h2>
        <p className="process__lede">Six stages, in order, every time. Written for the people we build with, not just for developers.</p>
      </header>
      <div className="pt__grid">
        <ol className="pt__list">
          {processStages.map((stage, index) => (
            <li key={stage.title} className={index === active ? 'is-active' : index < active ? 'is-done' : ''}>
              <button type="button" onClick={() => select(index)} aria-current={index === active ? 'step' : undefined}>
                <span className="pt__num">0{index + 1}</span>
                <span className="pt__title">{stage.title}</span>
              </button>
              <div className="pt__mobile-detail">
                <p>{stage.happens}</p>
                <p><b>You get:</b> {stage.youGet}</p>
                <p><b>Your role:</b> {stage.yourRole}</p>
              </div>
            </li>
          ))}
          <span className="pt__rail" aria-hidden="true"><i /></span>
        </ol>
        <div className="dos pt__terminal">
          <div className="dos__bar"><span>C:\DEVCORE\PROCESS.EXE</span><i /><i /><i /></div>
          <div className="dos__body" aria-live="polite"><TerminalState stage={processStages[active]} index={active} /></div>
        </div>
      </div>
    </section>
  )
}

/* ---------- G. Quality & reliability ---------- */

export function Quality({ reducedMotion }) {
  const sectionRef = useRef(null)
  useGSAP(() => {
    if (reducedMotion) return
    ScrollTrigger.batch('.spec-row:not(.spec-row--head)', {
      start: 'top 85%',
      once: true,
      onEnter: (rows) => gsap.timeline()
        .fromTo(rows, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.09, ease: 'power2.out' })
        .fromTo(rows.map((row) => row.querySelector('.spec-row__tick path')), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.35, stagger: 0.09 }, 0.2),
    })
    gsap.fromTo('.quality .spec-stamp', { scale: 1.6, autoAlpha: 0, rotate: -30 }, { scale: 1, autoAlpha: 0.85, rotate: -12, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: '.spec-sheet', start: 'bottom 85%', once: true } })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="paper quality" id="quality" ref={sectionRef} aria-labelledby="quality-title">
      <div className="spec-sheet">
        <header className="spec-sheet__head">
          <p className="kicker">Chapter 09 — Quality &amp; reliability</p>
          <h2 id="quality-title">The Fine Print</h2>
          <p>Six commitments we hold ourselves to on every project. They are working principles, not certifications.</p>
        </header>
        <div className="spec-table" role="table" aria-label="Engineering principles">
          <div className="spec-row spec-row--head" role="row">
            <span role="columnheader"><span className="visually-hidden">Checked</span></span>
            <span role="columnheader">Principle</span>
            <span role="columnheader">What it means for you</span>
            <span role="columnheader">How we practise it</span>
          </div>
          {qualityPrinciples.map((item) => (
            <div className="spec-row" role="row" key={item.title}>
              <span role="cell"><svg className="spec-row__tick" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" /><path d="m6 12 4 4 8-9" pathLength="1" /></svg></span>
              <strong role="cell">{item.title}</strong>
              <span role="cell">{item.means}</span>
              <span role="cell">{item.practice}</span>
            </div>
          ))}
        </div>
        <span className="spec-stamp" aria-hidden="true">OUR<br />STANDARD</span>
        <p className="spec-sheet__foot">* Principles describe how we work. They are not claims of formal certification or regulatory compliance.</p>
      </div>
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

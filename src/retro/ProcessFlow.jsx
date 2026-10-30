import { useRef, useState } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap.js'
import { processStages } from './data.js'
import { DESKTOP_MOTION, MOBILE_LANDSCAPE, MOBILE_PORTRAIT, SCENE_SCRUB, SCENE_SNAP, scenePace } from './motionModes.js'
import { scrollDepth } from './scrollDepth.js'

const LAST = processStages.length - 1
// Desktop: pinned scroll distance (viewport heights), and where the stage sequence runs within it.
const PIN_SCREENS = 3.4
const SEQ_START = 0.06
const SEQ_END = 0.92
const STOPS = processStages.map((_, index) => SEQ_START + (index / LAST) * (SEQ_END - SEQ_START))
// 3D track: how far a card turns (deg) and sinks (px) per card-step away from the centre, and
// how far from the centre (in card-steps) the turn stops growing.
const TURN = 32
const SINK = 150
const TURN_LIMIT = 1.5

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const ease = (t) => t * t * (3 - 2 * t)

function FlowCard({ stage, index }) {
  const number = String(index + 1).padStart(2, '0')
  return (
    <article className="flow-card" style={{ '--i': index }} aria-labelledby={`stage-${index}`}>
      <div className="flow-card__visual" aria-hidden="true">
        <span className="flow-card__numeral">{number}</span>
        <span className="flow-card__prompt">C:\DEVCORE&gt; RUN {stage.command}</span>
      </div>
      <div className="flow-card__body">
        <p className="flow-card__meta">Stage {number} / 0{processStages.length} · {stage.command}</p>
        <h3 id={`stage-${index}`}>{stage.title}</h3>
        <p className="flow-card__happens">{stage.happens}</p>
        <dl>
          <div><dt>You get</dt><dd>{stage.youGet}</dd></div>
          <div><dt>Your role</dt><dd>{stage.yourRole}</dd></div>
        </dl>
      </div>
    </article>
  )
}

// Chapter 08: the six stages as an editorial carousel. On desktop the section pins and scroll
// carries the cards along a horizontal 3D track, one stage flat in the centre at a time;
// elsewhere the stages flow vertically with a sticky progress rail. Native scrolling drives
// both; nothing is hijacked.
export function ProcessFlow() {
  const sectionRef = useRef(null)
  const triggerRef = useRef(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    const section = sectionRef.current
    const cards = gsap.utils.toArray('.flow-card', section)
    const backdrops = gsap.utils.toArray('.flow__bg i', section)
    const fills = gsap.utils.toArray('.flow__rail li', section)
    const mm = gsap.matchMedia()

    const setStage = (next) => {
      if (next === activeRef.current) return
      activeRef.current = next
      setActive(next)
    }
    // `filled` = how many segments are full (fractional while one fills).
    const paintRail = (filled) => fills.forEach((item, index) => item.style.setProperty('--fill', clamp01(filled - index).toFixed(3)))

    // Desktop: a pinned horizontal track. Scroll slides the cards right to left; each one turns in
    // from the right in 3D, settles flat in the centre, then turns away to the left.
    // Phones (portrait) run the same sequence; only the stage (track and rail) pins, below the
    // heading, so the cards get the full height of the screen.
    const cinematic = (mobile) => {
      section.classList.add('is-cinematic')
      section.classList.toggle('is-mobile', mobile)
      const stage = section.querySelector('.flow__stage')
      const track = section.querySelector('.flow__track')
      let step = 0
      const measure = () => {
        const wide = mobile ? Math.min(620, track.clientWidth * 0.9) : Math.min(620, Math.max(440, track.clientWidth * 0.46))
        step = wide * 0.9
        section.style.setProperty('--flow-wide', `${Math.round(wide)}px`)
      }
      const render = (p) => {
        const position = clamp01((p - SEQ_START) / (SEQ_END - SEQ_START)) * LAST
        // Each card's focus (1 = flat in the centre), from its distance to the centre in card-steps.
        const open = cards.map((_, index) => ease(clamp01(1 - Math.abs(index - position))))
        cards.forEach((card, index) => {
          const offset = index - position
          // Cards too far away to see are hidden and skipped, so each frame styles only a few.
          const distant = Math.abs(offset) >= 2.6
          card.style.visibility = distant ? 'hidden' : ''
          if (distant) return
          const turn = Math.max(-TURN_LIMIT, Math.min(TURN_LIMIT, offset))
          card.style.transform = `translate3d(${(offset * step).toFixed(1)}px, 0, ${(-Math.abs(turn) * SINK).toFixed(1)}px) rotateY(${(-turn * TURN).toFixed(2)}deg)`
          card.style.zIndex = String(10 - Math.round(Math.abs(offset) * 2))
          card.style.opacity = clamp01(2.6 - Math.abs(offset)).toFixed(3)
          card.style.setProperty('--open', open[index].toFixed(3))
          card.style.setProperty('--shift', turn.toFixed(3))
          card.classList.toggle('is-open', open[index] > 0.6)
        })
        backdrops.forEach((layer, index) => { layer.style.opacity = open[index].toFixed(3) })
        paintRail(position + 1)
        setStage(Math.round(position))
      }
      const state = { p: 0 }
      const tween = gsap.to(state, {
        p: 1,
        ease: 'none',
        onUpdate: () => render(state.p),
        scrollTrigger: {
          trigger: mobile ? stage : section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * PIN_SCREENS * scenePace())}`,
          pin: mobile ? stage : true,
          scrub: SCENE_SCRUB,
          invalidateOnRefresh: true,
          onRefresh: () => { measure(); render(state.p) },
          snap: { ...SCENE_SNAP, snapTo: [0, ...STOPS, 1] },
        },
      })
      triggerRef.current = tween.scrollTrigger
      measure()
      render(0)
      // Arrival: the heading and the track rise into place as the chapter comes up.
      gsap.fromTo('.flow__head > *', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 75%', once: true } })
      gsap.fromTo('.flow__track', { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 65%', once: true } })
      return () => {
        section.classList.remove('is-cinematic', 'is-mobile')
        section.style.removeProperty('--flow-wide')
        cards.forEach((card) => {
          card.style.removeProperty('transform')
          card.style.removeProperty('visibility')
          card.style.removeProperty('z-index')
          card.style.removeProperty('opacity')
          card.style.removeProperty('--open')
          card.style.removeProperty('--shift')
          card.classList.remove('is-open')
        })
        backdrops.forEach((layer) => layer.style.removeProperty('opacity'))
        triggerRef.current = null
      }
    }

    // Phones, tablets, short screens: a vertical flow. Each card rises in as it arrives and
    // settles back as it leaves, tied to the scroll position; the sticky rail follows. 'full'
    // adds a gentle 3D tilt (tablets, short desktops); 'light' only translates, scales and fades
    // over shorter distances (phones); 'still' does not move at all (reduced motion).
    const vertical = (mode) => {
      cards.forEach((card, index) => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top 60%',
          end: 'bottom 40%',
          onToggle: (self) => { if (self.isActive) setStage(index) },
          onUpdate: (self) => paintRail(index + self.progress),
        })
      })
      if (mode === 'still') return undefined
      const light = mode === 'light'
      const lift = light ? 30 : 56
      const shrink = light ? 0.035 : 0.05
      const tilt = light ? 0 : 8
      scrollDepth(cards, (index, enter, exit) => {
        const away = 1 - enter
        const card = cards[index]
        card.style.transform = `${tilt ? 'perspective(1000px) ' : ''}translate3d(0, ${(away * lift - exit * lift * 0.5).toFixed(1)}px, 0)${tilt ? ` rotateX(${(away * tilt - exit * tilt * 0.6).toFixed(2)}deg)` : ''} scale(${(1 - away * shrink - exit * shrink * 0.6).toFixed(4)})`
        card.style.opacity = (1 - away * 0.55 - exit * 0.4).toFixed(3)
      }, { exitFrom: 0.42, exitTo: 0.14 })
      // The stage numeral drifts against the scroll, a layer of depth inside each card.
      cards.forEach((card) => {
        gsap.fromTo(card.querySelector('.flow-card__numeral'), { yPercent: light ? 10 : 18 }, { yPercent: light ? -10 : -18, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      gsap.fromTo('.flow__head > *', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 80%', once: true } })
      return () => cards.forEach((card) => {
        card.style.removeProperty('transform')
        card.style.removeProperty('opacity')
      })
    }

    mm.add(DESKTOP_MOTION, () => cinematic(false))
    mm.add(MOBILE_PORTRAIT, () => cinematic(true))
    mm.add(MOBILE_LANDSCAPE, () => vertical('light'))
    // Reduced motion: the vertical flow, no animation; the rail still tracks the reader.
    mm.add('(prefers-reduced-motion: reduce)', () => vertical('still'))
    return () => mm.revert()
  }, { scope: sectionRef })

  // Rail buttons move the sequence to a stage: scroll, so card, text and rail stay in sync.
  const select = (index) => {
    const st = triggerRef.current
    if (st) {
      window.scrollTo({ top: st.start + (st.end - st.start) * STOPS[index], behavior: 'smooth' })
      return
    }
    sectionRef.current.querySelectorAll('.flow-card')[index]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const onRailKey = (event, index) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, Home: -index, End: LAST - index }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = Math.min(LAST, Math.max(0, index + keys[event.key]))
    select(next)
    event.currentTarget.closest('ol').querySelectorAll('button')[next]?.focus()
  }

  return (
    <section className="flow" id="process" ref={sectionRef} aria-labelledby="process-title">
      <div className="flow__bg" aria-hidden="true">
        {processStages.map((stage, index) => <i key={stage.title} style={{ '--i': index }} />)}
      </div>
      <header className="flow__head">
        <p className="kicker">Chapter 08 — How we work</p>
        <h2 id="process-title">How We Work</h2>
        <p className="flow__lede">Six stages, in order, every time. Written for the people we build with, not just for developers.</p>
      </header>
      <div className="flow__stage">
        <nav className="flow__rail" aria-label="Workflow stages">
          <p className="flow__counter" aria-hidden="true"><b>{String(active + 1).padStart(2, '0')}</b> / 0{processStages.length}<span>{processStages[active].title}</span></p>
          <ol>
            {processStages.map((stage, index) => (
              <li key={stage.title} className={index === active ? 'is-active' : ''}>
                <button type="button" onClick={() => select(index)} onKeyDown={(event) => onRailKey(event, index)} aria-current={index === active ? 'step' : undefined} aria-label={`Stage ${index + 1}: ${stage.title}`}>
                  <i />
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flow__track">
          {processStages.map((stage, index) => <FlowCard key={stage.title} stage={stage} index={index} />)}
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">Stage {active + 1} of {processStages.length}: {processStages[active].title}</p>
    </section>
  )
}

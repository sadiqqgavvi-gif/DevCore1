import { useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, MoveUpRight } from 'lucide-react'
import SectionKicker from '../../components/ui/SectionKicker.jsx'
import { processSteps } from '../../data/process.data.js'
import { gsap, useGSAP } from '../../lib/gsap.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import './HowWeWork.css'

const mapPoints = [
  { x: 8, y: 82 },
  { x: 29, y: 70 },
  { x: 47, y: 54 },
  { x: 64, y: 40 },
  { x: 81, y: 26 },
  { x: 92, y: 9 },
]

export default function HowWeWork() {
  const sectionRef = useRef(null)
  const experienceRef = useRef(null)
  const activeStepRef = useRef(0)
  const [activeStep, setActiveStep] = useState(0)
  const reducedMotion = useReducedMotion()
  const step = processSteps[activeStep]

  function selectStep(index) {
    activeStepRef.current = index
    setActiveStep(index)
  }

  useGSAP(() => {
    if (reducedMotion) return

    const responsiveMotion = gsap.matchMedia()
    responsiveMotion.add('(min-width: 1001px)', () => {
      const route = sectionRef.current.querySelector('.process-map__route')
      const progress = sectionRef.current.querySelector('.process-journey__progress-fill')
      const updateJourney = (value) => {
        if (route) route.style.strokeDashoffset = String(1 - value)
        if (progress) progress.style.transform = `scaleX(${value})`
        const nextStep = Math.min(processSteps.length - 1, Math.floor(value * processSteps.length))
        if (nextStep !== activeStepRef.current) {
          activeStepRef.current = nextStep
          setActiveStep(nextStep)
        }
      }

      gsap.fromTo('.process-journey__title-line',
        { yPercent: 110, rotateX: -7 },
        {
          yPercent: 0,
          rotateX: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.process-journey__heading', start: 'top 80%', once: true },
        },
      )

      gsap.timeline({
        scrollTrigger: {
          trigger: experienceRef.current,
          start: 'top 12vh',
          end: '+=230%',
          pin: experienceRef.current,
          scrub: 0.75,
          invalidateOnRefresh: true,
          onUpdate: (self) => updateJourney(self.progress),
          onRefresh: (self) => updateJourney(self.progress),
        },
      })
        .fromTo('.process-map__route', { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none' }, 0)
        .fromTo('.process-journey__progress-fill', { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', ease: 'none' }, 0)
        .fromTo('.process-journey__experience', { rotateX: 1.5, scale: 0.985 }, { rotateX: 0, scale: 1, ease: 'none' }, 0)
    })

    responsiveMotion.add('(max-width: 1000px)', () => {
      const route = sectionRef.current.querySelector('.process-map__route')
      const progress = sectionRef.current.querySelector('.process-journey__progress-fill')
      const stages = gsap.utils.toArray('.process-journey__static-stage', sectionRef.current)
      const movementScale = window.innerWidth <= 760 ? 0.55 : 0.8
      const updateActiveStep = (value) => {
        const nextStep = Math.min(processSteps.length - 1, Math.floor(value * processSteps.length))
        if (nextStep !== activeStepRef.current) {
          activeStepRef.current = nextStep
          setActiveStep(nextStep)
        }
      }

      gsap.fromTo('.process-journey__title-line',
        { yPercent: 42, autoAlpha: 0.72 },
        {
          yPercent: 0,
          autoAlpha: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: {
            trigger: '.process-journey__heading',
            start: 'top 88%',
            end: 'top 58%',
            scrub: 0.55,
            invalidateOnRefresh: true,
          },
        },
      )

      gsap.timeline({
        scrollTrigger: {
          trigger: experienceRef.current,
          start: 'top 88%',
          end: 'bottom 52%',
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      })
        .fromTo(experienceRef.current,
          { y: 24 * movementScale, z: -35 * movementScale, rotationX: 2 * movementScale, scale: 0.985 },
          { y: 0, z: 0, rotationX: 0, scale: 1, ease: 'none' },
          0,
        )

      gsap.timeline({
        scrollTrigger: {
          trigger: '.process-journey__static',
          start: 'top 90%',
          end: 'bottom 58%',
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => updateActiveStep(self.progress),
          onRefresh: (self) => updateActiveStep(self.progress),
        },
      })
        .fromTo(route, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none' }, 0)
        .fromTo(progress, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', ease: 'none' }, 0)

      stages.forEach((stage, index) => {
        const direction = index % 2 === 0 ? -1 : 1
        const copy = stage.querySelector('div')
        const arrow = stage.querySelector('svg')
        const reveal = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: 'top 91%',
            end: 'center 61%',
            scrub: 0.6,
            invalidateOnRefresh: true,
            onEnter: () => selectStep(index),
            onEnterBack: () => selectStep(index),
          },
        })

        reveal
          .fromTo(stage, {
            x: direction * 24 * movementScale,
            y: 10 * movementScale,
            z: -26 * movementScale,
            rotationY: direction * 2.5 * movementScale,
            autoAlpha: 0.68,
            transformPerspective: 900,
          }, {
            x: 0,
            y: 0,
            z: 0,
            rotationY: 0,
            autoAlpha: 1,
            ease: 'none',
          })
          .fromTo(copy,
            { x: direction * -9 * movementScale, autoAlpha: 0.82 },
            { x: 0, autoAlpha: 1, ease: 'none' },
            0.1,
          )
          .fromTo(arrow,
            { y: 5 * movementScale, autoAlpha: 0.65 },
            { y: 0, autoAlpha: 1, ease: 'none' },
            0.12,
          )
      })
    })

    return () => responsiveMotion.revert()
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="process-journey section-wrap" id="process" ref={sectionRef}>
      <SectionKicker number="04" label="HOW WE WORK" aside="NO MYSTERY, JUST MOMENTUM" className="reveal" />
      <div className="process-journey__heading">
        <p className="eyebrow">A CLEAR PATH FORWARD</p>
        <h2 aria-label="Good work is a team sport.">
          <span className="process-journey__title-line">Good work is</span>
          <span className="process-journey__title-line process-journey__title-line--muted">a team sport.</span>
        </h2>
        <p>Small, focused teams. Open communication. Shared ownership from the first question to the final handoff.</p>
      </div>
      <div className="process-journey__experience" ref={experienceRef}>
        <div className="process-map-panel" data-stage={step.number}>
          <div className="process-map-panel__head"><span>DEVCORE / DELIVERY MODEL</span><i>01 — 06 / SHARED SEQUENCE</i></div>
          <div className="process-map-panel__scene">
            <div className="process-map__grid" aria-hidden="true" />
            <div className="process-map__core" aria-hidden="true"><i /><i /><strong>{step.number}</strong></div>
            <svg className="process-map" viewBox="0 0 500 270" preserveAspectRatio="none" aria-hidden="true">
              <path className="process-map__route" pathLength="1" d="M40 232 C91 222 95 192 147 188 S205 154 235 146 S290 111 320 108 S375 73 404 69 S452 36 460 25" />
              <path className="process-map__route-echo" d="M40 232 C91 222 95 192 147 188 S205 154 235 146 S290 111 320 108 S375 73 404 69 S452 36 460 25" />
            </svg>
            <div className="process-map__nodes" aria-label="Select a process stage">
              {processSteps.map(({ number, title }, index) => {
                const point = mapPoints[index]
                return (
                  <button
                    className={`process-map__node${activeStep === index ? ' is-active' : ''}`}
                    key={number}
                    type="button"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    aria-label={`Select stage ${number}: ${title}`}
                    aria-pressed={activeStep === index}
                    onClick={() => selectStep(index)}
                  >
                    <span>{number}</span>
                  </button>
                )
              })}
            </div>
            <span className="process-map__coordinate">PATH / {step.number} — 06</span>
          </div>
          <div className="process-map-panel__foot"><span>PRODUCT / DESIGN / ENGINEERING</span><span>BUILT TO MOVE FORWARD</span></div>
        </div>
        <div className="process-journey__active" aria-live="polite">
          <div className="process-journey__active-top"><span>STAGE {step.number} / 06</span><MoveUpRight size={17} aria-hidden="true" /></div>
          <span className="process-journey__signal">{step.signal}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          <div className="process-journey__progress" aria-hidden="true"><span className="process-journey__progress-fill" /></div>
          <div className="process-journey__active-foot"><span>SCROLL TO MOVE THROUGH THE JOURNEY</span><span>{step.number}</span></div>
        </div>
      </div>
      <div className="process-journey__static" aria-label="All stages of the delivery process">
        {processSteps.map(({ number, title, description, signal }) => (
          <article className="process-journey__static-stage" key={number}>
            <span>{number} / 06</span>
            <div><i>{signal}</i><h3>{title}</h3><p>{description}</p></div>
            <ArrowUpRight size={17} aria-hidden="true" />
          </article>
        ))}
      </div>
      <a className="process-next-link" href="#contact">Talk through a project <ArrowDownRight size={15} /></a>
    </section>
  )
}

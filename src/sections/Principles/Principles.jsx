import { useRef } from 'react'
import { ArrowDownRight } from 'lucide-react'
import SectionKicker from '../../components/ui/SectionKicker.jsx'
import { principles } from '../../data/principles.data.js'
import { gsap, useGSAP } from '../../lib/gsap.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import './Principles.css'

export default function Principles() {
  const sectionRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (reducedMotion) return

    gsap.fromTo('.principles__title-line',
      { yPercent: 110, rotateX: -7 },
      {
        yPercent: 0,
        rotateX: 0,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.principles__heading', start: 'top 80%', once: true },
      },
    )
    const networkNodes = gsap.utils.toArray('.principles-map__wiring circle', sectionRef.current)
    const network = gsap.timeline({
      scrollTrigger: { trigger: '.principles-map', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
    })
    network
      .fromTo('.principles-map__path', { strokeDashoffset: 1 }, {
        strokeDashoffset: 0,
        ease: 'none',
      })
      .fromTo('.principles-map__wiring',
        { x: -14, y: 8, rotationY: -1.2 },
        { x: 14, y: -8, rotationY: 1.2, ease: 'none' },
        0,
      )
    networkNodes.forEach((node, index) => {
      network.fromTo(node,
        { scale: 0.7, autoAlpha: 0.4 },
        { scale: 1.15, autoAlpha: 1, duration: 0.2, ease: 'none' },
        0.18 + index * 0.17,
      )
    })
    const responsiveMotion = gsap.matchMedia()
    responsiveMotion.add({
      desktop: '(min-width: 1001px)',
      tablet: '(min-width: 761px) and (max-width: 1000px)',
      mobile: '(max-width: 760px)',
    }, (context) => {
      const { desktop, mobile } = context.conditions
      const cards = gsap.utils.toArray('.principle-card', sectionRef.current)
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: '.principles-grid',
          start: 'top 84%',
          end: () => `+=${Math.round(window.innerHeight * (desktop ? 1.1 : mobile ? 0.65 : 0.75))}`,
          scrub: 0.75,
          invalidateOnRefresh: true,
        },
      })

      cards.forEach((card, index) => {
        const offset = index * (desktop ? 0.13 : 0.09)
        const direction = index % 2 === 0 ? -1 : 1
        const mark = card.querySelector('.principle-card__mark-wrap')
        const copy = card.querySelector('.principle-card__copy')
        const icon = card.querySelector('.principle-card__head svg')

        timeline.fromTo(card,
          {
            autoAlpha: 0.22,
            x: direction * (desktop ? 58 : mobile ? 16 : 26),
            y: desktop ? 12 : mobile ? 4 : 6,
            z: desktop ? -55 : mobile ? -12 : -20,
            rotationY: direction * (desktop ? 7 : mobile ? 1.5 : 2),
            scale: desktop ? 0.98 : mobile ? 0.995 : 0.99,
            transformOrigin: direction < 0 ? '0% 50%' : '100% 50%',
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            z: 0,
            rotationY: 0,
            scale: 1,
            duration: 0.52,
            ease: 'power2.out',
          },
          offset,
        )
        timeline.fromTo(mark,
          { autoAlpha: 0.65, y: 15, z: -16 },
          { autoAlpha: 1, y: 0, z: 0, duration: 0.32, ease: 'power2.out' },
          offset + 0.12,
        )
        timeline.fromTo(copy,
          { autoAlpha: 0, x: direction * -14, y: 6 },
          { autoAlpha: 1, x: 0, y: 0, duration: 0.32, ease: 'power2.out' },
          offset + 0.17,
        )
        timeline.fromTo(icon,
          { autoAlpha: 0.4, y: -8, z: 12 },
          { autoAlpha: 1, y: 0, z: 0, duration: 0.28, ease: 'power2.out' },
          offset + 0.1,
        )
      })

      return () => timeline.scrollTrigger?.kill()
    })
    return () => responsiveMotion.revert()
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="principles section-wrap" id="principles" ref={sectionRef}>
      <SectionKicker number="06" label="WHY DEVCORE" aside="PRINCIPLES IN PRACTICE" className="reveal" />
      <div className="principles__heading">
        <div>
          <p className="eyebrow">HOW WE THINK ABOUT THE WORK</p>
          <h2 aria-label="Good software begins with good principles.">
            <span className="principles__title-line">Good software begins</span>
            <span className="principles__title-line principles__title-line--muted">with good principles.</span>
          </h2>
        </div>
        <p>These are the ideas that guide our decisions — from the first product question to the systems underneath it.</p>
      </div>
      <div className="principles-map">
        <svg className="principles-map__wiring" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
          <path className="principles-map__path" pathLength="1" d="M92 88 C240 88 284 140 410 140 S595 210 720 210 S844 335 916 404" />
          <path className="principles-map__echo" d="M92 88 C240 88 284 140 410 140 S595 210 720 210 S844 335 916 404" />
          <circle cx="92" cy="88" r="4" /><circle cx="410" cy="140" r="4" /><circle cx="720" cy="210" r="4" /><circle cx="916" cy="404" r="4" />
        </svg>
        <div className="principles-grid">
          {principles.map(({ number, title, description, signal, icon: Icon }) => (
            <article className="principle-card" key={number}>
              <div className="principle-card__head"><span>PRINCIPLE / {number}</span><Icon size={18} strokeWidth={1.4} aria-hidden="true" /></div>
              <div className="principle-card__mark-wrap">
                <div className="principle-card__mark" aria-hidden="true"><i /><strong>{number}</strong></div>
              </div>
              <div className="principle-card__copy">
                <span>{signal}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="principles__foot"><span>ONE STANDARD / MANY WAYS TO SOLVE</span><a href="#services">Explore our disciplines <ArrowDownRight size={14} /></a></div>
    </section>
  )
}

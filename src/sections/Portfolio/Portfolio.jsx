import { useRef } from 'react'
import { ArrowRight, ArrowUpRight, Orbit } from 'lucide-react'
import SectionKicker from '../../components/ui/SectionKicker.jsx'
import { gsap, useGSAP } from '../../lib/gsap.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import './Portfolio.css'

const projects = [
  {
    number: '01',
    category: 'Commerce · Concept study',
    title: 'A calmer way to shop.',
    description: 'A considered storefront concept for a modern independent brand.',
    className: 'commerce',
    visual: (
      <div className="work-visual commerce-visual" aria-hidden="true">
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
    number: '02',
    category: 'AI workspace · Concept study',
    title: 'Knowledge, in motion.',
    description: 'An interface concept for turning scattered information into clear answers.',
    className: 'intelligence',
    visual: (
      <div className="work-visual intelligence-visual" aria-hidden="true">
        <div className="ai-window">
          <div className="ai-sidebar"><span className="ai-mark">d.</span><span className="ai-nav active">⌂</span><span className="ai-nav">◌</span><span className="ai-nav">▤</span><span className="ai-avatar">A</span></div>
          <div className="ai-content"><small>YOUR WORKSPACE <span>● CONNECTED</span></small><strong>Good morning, Alex.</strong><p>What would you like to find?</p><div className="ai-search"><Orbit size={14} /><span>Ask anything about your workspace...</span><ArrowUpRight size={13} /></div><div className="ai-sources"><i>NOTES</i><i>PROJECTS</i><i>DOCUMENTS</i></div><div className="ai-result"><span>✦</span><div><b>Suggested starting points</b><em>Three useful threads from your recent work</em></div><ArrowRight size={13} /></div></div>
        </div>
      </div>
    ),
  },
  {
    number: '03',
    category: 'Operations · Concept study',
    title: 'Every detail, in sync.',
    description: 'A unified operations dashboard concept for teams that keep things moving.',
    className: 'operations',
    visual: (
      <div className="work-visual operations-visual" aria-hidden="true">
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
    number: '04',
    category: 'Product design · Concept study',
    title: 'Systems with a point of view.',
    description: 'A flexible visual language concept for a family of digital products.',
    className: 'design-system',
    visual: (
      <div className="work-visual design-system-visual" aria-hidden="true">
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

export default function Portfolio() {
  const sectionRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (reducedMotion) return

    const responsiveMotion = gsap.matchMedia()
    responsiveMotion.add('(min-width: 761px)', () => {
      const track = sectionRef.current.querySelector('.work-track')
      const journey = sectionRef.current.querySelector('.work-journey')
      const cards = Array.from(sectionRef.current.querySelectorAll('.work-card'))
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: journey,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          pin: sectionRef.current.querySelector('.work-pin'),
          invalidateOnRefresh: true,
        },
      })
      timeline
        .to(track, { x: () => -Math.max(0, track.scrollWidth - window.innerWidth), ease: 'none' })
        .fromTo('.work-progress-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)

      cards.forEach((card, index) => {
        const position = index * (0.72 / Math.max(1, cards.length - 1))
        const artwork = card.querySelector('.work-artwork__depth')
        const frame = card.querySelector('.artwork-frame')
        const meta = card.querySelector('.work-meta')
        const direction = index % 2 === 0 ? 1 : -1

        timeline.fromTo(artwork,
          { x: direction * 22, y: 13, z: -42, scale: 0.975, rotationY: direction * 2.2 },
          { x: 0, y: 0, z: 0, scale: 1, rotationY: 0, duration: 0.28, ease: 'none' },
          position,
        )
        timeline.fromTo(frame,
          { y: direction * -7, z: 12, opacity: 0.35 },
          { y: 0, z: 0, opacity: 1, duration: 0.24, ease: 'none' },
          position + 0.04,
        )
        timeline.fromTo(meta,
          { x: direction * 26, y: 8, autoAlpha: 0.72 },
          { x: 0, y: 0, autoAlpha: 1, duration: 0.25, ease: 'none' },
          position + 0.06,
        )
      })
    })

    responsiveMotion.add('(max-width: 760px)', () => {
      const cards = gsap.utils.toArray('.work-card', sectionRef.current)
      cards.forEach((card, index) => {
        const direction = index % 2 === 0 ? -1 : 1
        const artwork = card.querySelector('.work-artwork__depth')
        const frame = card.querySelector('.artwork-frame')
        const meta = card.querySelector('.work-meta')
        const reveal = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            end: 'center 57%',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })

        reveal
          .fromTo(artwork,
            { x: direction * 18, y: 18, z: -26, rotationY: direction * 3, scale: 0.975, autoAlpha: 0.72 },
            { x: 0, y: 0, z: 0, rotationY: 0, scale: 1, autoAlpha: 1, ease: 'none' },
          )
          .fromTo(frame,
            { y: -7, z: 10, opacity: 0.5 },
            { y: 0, z: 0, opacity: 1, ease: 'none' },
            0.08,
          )
          .fromTo(meta,
            { x: direction * -14, y: 10, autoAlpha: 0.74 },
            { x: 0, y: 0, autoAlpha: 1, ease: 'none' },
            0.12,
          )
      })
    })

    return () => responsiveMotion.revert()
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="work" id="work" ref={sectionRef}>
      <div className="work-heading section-wrap">
        <SectionKicker number="03" label="SELECTED WORK" aside="CONCEPT EXPLORATIONS" className="reveal" />
        <div className="section-heading work-heading-copy reveal">
          <div><p className="eyebrow">MADE WITH INTENTION</p><h2>Possibility,<br /><span>made tangible.</span></h2></div>
          <p className="heading-note">Four product directions, imagined as a horizontal journey. Concepts to show how we think — not client commissions.</p>
        </div>
      </div>
      <div className="work-journey">
        <div className="work-pin">
          <div className="work-track">
            {projects.map((project) => (
              <article className={`work-card ${project.className}`} key={project.number} data-spotlight>
                <div className="work-artwork">
                  <span className="artwork-index">{project.number} / 04</span>
                  <span className="artwork-frame" aria-hidden="true" />
                  <div className="work-artwork__depth">{project.visual}</div>
                  <span className="artwork-coordinate">DEVCORE / CONCEPT SERIES</span>
                </div>
                <div className="work-meta"><div><span>{project.number} — {project.category}</span><h3>{project.title}</h3><p>{project.description}</p></div><ArrowUpRight size={18} /></div>
              </article>
            ))}
          </div>
          <div className="work-progress-track"><span className="work-progress-fill" /></div>
          <span className="work-journey-label">SCROLL TO EXPLORE <ArrowRight size={12} /></span>
        </div>
      </div>
      <p className="work-disclaimer section-wrap reveal"><span>NOTE</span> Concept explorations are illustrative, not client work.</p>
    </section>
  )
}

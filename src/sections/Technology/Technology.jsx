import { useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import SectionKicker from '../../components/ui/SectionKicker.jsx'
import { technologyGroups } from '../../data/technology.data.js'
import { gsap, useGSAP } from '../../lib/gsap.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import './Technology.css'

function TechnologyNetwork({ network, nodes }) {
  return (
    <svg className="technology-network" viewBox="0 0 300 110" aria-hidden="true">
      <path className="technology-network__echo" d={network} />
      <path className="technology-network__path" d={network} pathLength="1" />
      {nodes.map(([cx, cy], index) => <circle key={`${cx}-${cy}-${index}`} cx={cx} cy={cy} r={index === Math.floor(nodes.length / 2) ? 3.2 : 2.3} />)}
    </svg>
  )
}

export default function Technology() {
  const sectionRef = useRef(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (reducedMotion) return

    gsap.fromTo('.technology__title-line',
      { yPercent: 110, rotateX: -7 },
      {
        yPercent: 0,
        rotateX: 0,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.technology__heading', start: 'top 80%', once: true },
      },
    )
    const responsiveMotion = gsap.matchMedia()
    responsiveMotion.add({
      desktop: '(min-width: 1001px)',
      compact: '(max-width: 1000px)',
    }, (context) => {
      const { desktop } = context.conditions
      const groups = gsap.utils.toArray('.technology-group', sectionRef.current)
      const beams = gsap.utils.toArray('.technology-universe__beam', sectionRef.current)
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: '.technology-universe',
          start: 'top 84%',
          end: () => `+=${Math.round(window.innerHeight * (desktop ? 1.15 : 0.8))}`,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      })

      timeline.fromTo(beams[0],
        { x: desktop ? -26 : -12, y: 12 },
        { x: desktop ? 24 : 12, y: -12, duration: 1.05, ease: 'none' },
        0,
      )
      timeline.fromTo(beams[1],
        { x: desktop ? 18 : 8, y: -10 },
        { x: desktop ? -20 : -9, y: 10, duration: 1.05, ease: 'none' },
        0,
      )

      groups.forEach((group, index) => {
        const offset = index * (desktop ? 0.12 : 0.08)
        const direction = index % 2 === 0 ? -1 : 1
        const motion = group.querySelector('.technology-group__motion')
        const visual = group.querySelector('.technology-group__visual')
        const title = group.querySelector('.technology-group__copy strong')
        const description = group.querySelector('.technology-group__copy > span')
        const tools = gsap.utils.toArray('.technology-tool', group)

        timeline.fromTo(group,
          {
            x: desktop ? direction * 8 : direction * (context.conditions.compact ? 14 : 20),
            y: desktop ? 56 : direction < 0 ? 23 : -15,
            z: desktop ? -125 : -40,
            rotationX: desktop ? 8 : 3,
            rotationY: direction * (desktop ? 4 : context.conditions.compact ? 2 : 2.5),
            scale: desktop ? 0.96 : 0.985,
            transformOrigin: '50% 70%',
          },
          {
            x: 0,
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            duration: 0.55,
            ease: 'power2.out',
          },
          offset,
        )
        timeline.fromTo(visual,
          {
            y: desktop ? 13 : 8,
            z: desktop ? -28 : -14,
            rotationX: desktop ? 4 : 2,
            scale: 0.94,
          },
          {
            y: 0,
            z: 0,
            rotationX: 0,
            scale: 1,
            duration: 0.42,
            ease: 'power2.out',
          },
          offset + 0.05,
        )
        timeline.fromTo(motion,
          { autoAlpha: 0.24 },
          { autoAlpha: 1, duration: 0.38, ease: 'power2.out' },
          offset,
        )
        timeline.fromTo(title,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' },
          offset + 0.16,
        )
        timeline.fromTo(description,
          { autoAlpha: 0, y: 9 },
          { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' },
          offset + 0.21,
        )
        timeline.fromTo(tools,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.025, ease: 'power2.out' },
          offset + 0.26,
        )
      })

      return () => timeline.scrollTrigger?.kill()
    })
    gsap.utils.toArray('.technology-network', sectionRef.current).forEach((network) => {
      const path = network.querySelector('.technology-network__path')
      const nodes = gsap.utils.toArray('circle', network)
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: network.closest('.technology-group'),
          start: 'top 88%',
          end: 'bottom 52%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
      timeline.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none' }, 0)
      nodes.forEach((node, index) => {
        timeline.fromTo(node,
          { scale: 0.65, autoAlpha: 0.45 },
          { scale: 1.2, autoAlpha: 1, ease: 'none', duration: 0.22 },
          0.16 + index * 0.12,
        )
      })
    })
    return () => responsiveMotion.revert()
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="technology" id="technology" ref={sectionRef}>
      <div className="technology__inner section-wrap">
        <SectionKicker number="05" label="THE TOOLKIT" aside="CHOSEN FOR THE JOB" className="reveal" />
        <div className="technology__heading">
          <div>
            <p className="eyebrow">A PRACTICAL TECHNOLOGY UNIVERSE</p>
            <h2 aria-label="The right tools, for the right reasons.">
              <span className="technology__title-line">The right tools.</span>
              <span className="technology__title-line technology__title-line--muted">For the right reasons.</span>
            </h2>
          </div>
          <p>We choose a stack to fit the work. Explore the disciplines to see the tools already in our toolkit.</p>
        </div>
        <div className={`technology-universe${activeGroup ? ' has-selection' : ''}`} data-active-group={activeGroup || ''}>
          <div className="technology-universe__beam technology-universe__beam--one" aria-hidden="true" />
          <div className="technology-universe__beam technology-universe__beam--two" aria-hidden="true" />
          {technologyGroups.map(({ id, number, category, title, description, signal, icon: Icon, network, nodes, technologies }) => (
            <button
              className={`technology-group technology-group--${id}${activeGroup === id ? ' is-selected' : ''}`}
              key={id}
              type="button"
              aria-pressed={activeGroup === id}
              aria-label={`${category}: ${technologies.map(({ name }) => name).join(', ')}`}
              onClick={() => setActiveGroup((current) => current === id ? null : id)}
            >
              <span className="technology-group__motion">
                <span className="technology-group__head">
                  <span><Icon size={16} strokeWidth={1.5} aria-hidden="true" /> {category}</span>
                  <i>{number}</i>
                </span>
                <span className="technology-group__visual">
                  <TechnologyNetwork network={network} nodes={nodes} />
                  <span className="technology-group__signal">{signal}</span>
                  <span className="technology-group__glyph"><Icon size={19} strokeWidth={1.35} aria-hidden="true" /></span>
                </span>
                <span className="technology-group__copy">
                  <strong>{title}</strong>
                  <span>{description}</span>
                </span>
                <span className="technology-group__tools">
                  {technologies.map(({ name, icon: ToolIcon }) => (
                    <span className="technology-tool" key={name}><ToolIcon size={12} strokeWidth={1.5} aria-hidden="true" />{name}</span>
                  ))}
                </span>
              </span>
              <ArrowUpRight className="technology-group__arrow" size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="technology__foot">
          <span>TOOLS SERVE THE PRODUCT / NOT THE OTHER WAY AROUND</span>
          {activeGroup
            ? <button type="button" onClick={() => setActiveGroup(null)}>CLEAR FOCUS <ArrowDownRight size={13} /></button>
            : <span>SELECT A DISCIPLINE TO HIGHLIGHT</span>}
        </div>
      </div>
    </section>
  )
}

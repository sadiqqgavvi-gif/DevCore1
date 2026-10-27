import { useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import SectionKicker from '../../components/ui/SectionKicker.jsx'
import { services } from '../../data/services.data.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { gsap, useGSAP } from '../../lib/gsap.js'
import './WhatWeDo.css'

function ServicePreview({ type }) {
  if (type === 'product') {
    return (
      <div className="service-preview__art service-preview__art--product">
        <div className="product-preview-window">
          <div className="product-preview-top"><i /><i /><i /><span>DEVCORE / PRODUCT SYSTEMS</span></div>
          <div className="product-preview-nav"><b>d.</b><span>OVERVIEW</span><span>PROJECTS</span><span>INSIGHTS</span><i>↗</i></div>
          <div className="product-preview-content">
            <div><small>MONDAY / 09:41</small><strong>Good work,<br /><em>in motion.</em></strong><span>Bring the moving parts into focus.</span></div>
            <div className="product-preview-orbit"><i /><i /><i /><b>01</b></div>
          </div>
          <div className="product-preview-footer"><span>FIG. 01 / INTERFACE STUDY</span><span>BUILD WITH INTENTION</span></div>
        </div>
      </div>
    )
  }
  if (type === 'intelligence') {
    return (
      <div className="service-preview__art service-preview__art--intelligence">
        <div className="ai-preview">
          <span className="ai-preview-node ai-preview-node--one">INPUT</span>
          <span className="ai-preview-node ai-preview-node--two">MODEL</span>
          <span className="ai-preview-node ai-preview-node--three">ACTION</span>
          <span className="ai-preview-line ai-preview-line--one" />
          <span className="ai-preview-line ai-preview-line--two" />
          <div className="ai-preview-core"><i /><i /><i /><strong>AI</strong></div>
          <span className="ai-preview-caption">A USEFUL SIGNAL, NOT MORE NOISE</span>
        </div>
      </div>
    )
  }
  if (type === 'systems') {
    return (
      <div className="service-preview__art service-preview__art--systems">
        <div className="systems-stack"><span>INTERFACE <b>01</b></span><span>APPLICATION <b>02</b></span><span>DATA LAYER <b>03</b></span></div>
        <div className="systems-side-note">A CLEAR PATH<br />THROUGH COMPLEXITY</div>
        <i className="systems-wire systems-wire--one" /><i className="systems-wire systems-wire--two" />
      </div>
    )
  }
  if (type === 'design') {
    return (
      <div className="service-preview__art service-preview__art--design">
        <div className="design-preview-sheet">
          <span>FORM / 01&nbsp;&nbsp;&nbsp;&nbsp; VISUAL LANGUAGE</span>
          <strong>Make room<br /><em>for better.</em></strong>
          <div><i /><i /><i /><i /></div>
          <small>TYPE / COLOR / MOTION</small>
        </div>
        <span className="design-preview-tag">Aa</span>
      </div>
    )
  }
  if (type === 'platforms') {
    return (
      <div className="service-preview__art service-preview__art--platforms">
        <div className="platform-preview">
          <span className="platform-node">APP</span><span className="platform-node">API</span>
          <span className="platform-node">DATA</span><span className="platform-node">TOOLS</span>
          <svg viewBox="0 0 420 150" aria-hidden="true">
            <path d="M66 74H166M210 74H310M210 74V28M210 74V120" />
            <circle cx="66" cy="74" r="3" /><circle cx="210" cy="74" r="3" /><circle cx="354" cy="74" r="3" />
          </svg>
        </div>
        <span className="platform-preview-caption">CONNECTED BY DESIGN</span>
      </div>
    )
  }
  return (
    <div className="service-preview__art service-preview__art--cloud">
      <div className="cloud-preview-console">
        <div><span>DEPLOYMENT / PIPELINE</span><i>HEALTHY</i></div>
        <span className="cloud-preview-step"><b>01</b> COMMIT <i /></span>
        <span className="cloud-preview-step"><b>02</b> BUILD <i /></span>
        <span className="cloud-preview-step"><b>03</b> RELEASE <i /></span>
      </div>
      <div className="cloud-preview-orbit"><span /><span /></div>
    </div>
  )
}

export default function WhatWeDo() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    const stage = stageRef.current
    const orbit = sectionRef.current?.querySelector('.service-orbit')
    if (!stage || !orbit || reducedMotion) return

    const entries = gsap.utils.toArray('.service-orbit__track .service-entry', sectionRef.current)
    const ambientCards = gsap.utils.toArray('.service-orbit__track .service-entry__ambient', sectionRef.current)
    if (!entries.length) return

    const responsiveMotion = gsap.matchMedia()
    const createOrbitSequence = ({ compact = false, mobile = false } = {}) => {
      const section = sectionRef.current
      if (!section) return

      section.classList.add('has-orbit-motion')
      let activeIndex = -1
      const orbitEase = gsap.parseEase('power1.inOut')
      const renderOrbit = (progress) => {
        const easedProgress = orbitEase(gsap.utils.clamp(0, 1, progress))
        const rotation = easedProgress * Math.PI * 2
        const widestCard = Math.max(...entries.map((entry) => entry.offsetWidth))
        const availableRadius = Math.max(0, orbit.clientWidth / 2 - widestCard / 2 - 12)
        const radiusX = compact
          ? Math.min(orbit.clientWidth * (mobile ? 0.2 : 0.25), availableRadius)
          : Math.max(0, Math.min(
            orbit.clientWidth * 0.34,
            485,
            orbit.clientWidth / 2 - widestCard * 0.68,
          ))
        const radiusY = compact
          ? Math.min(window.innerHeight * (mobile ? 0.045 : 0.07), mobile ? 34 : 52, orbit.clientHeight * 0.055)
          : Math.min(window.innerHeight * 0.075, 64, orbit.clientHeight * 0.14)
        let frontIndex = 0
        let frontDepth = -Infinity

        entries.forEach((entry, index) => {
          const angle = (index / entries.length) * Math.PI * 2 + rotation + Math.PI / 2
          const depth = (Math.sin(angle) + 1) / 2
          const x = Math.cos(angle) * radiusX
          const y = Math.sin(angle) * radiusY
          const scale = (compact ? 0.78 : 0.7) + depth * (compact ? 0.22 : 0.3)
          const z = (compact ? -95 : -75) + depth * (compact ? 220 : 210)
          const tilt = Math.cos(angle) * (compact ? (mobile ? -13 : -10) : -8)
          const opacity = compact ? 0.12 + depth * 0.88 : 0.38 + depth * 0.62
          const blur = (1 - depth) * (compact ? 1.1 : 0.8)
          entry.style.setProperty('--orbit-x', `${x.toFixed(1)}px`)
          entry.style.setProperty('--orbit-y', `${y.toFixed(1)}px`)
          entry.style.setProperty('--orbit-z', `${z.toFixed(1)}px`)
          entry.style.setProperty('--orbit-scale', scale.toFixed(3))
          entry.style.setProperty('--orbit-tilt', `${tilt.toFixed(2)}deg`)
          entry.style.setProperty('--orbit-opacity', opacity.toFixed(3))
          entry.style.setProperty('--orbit-blur', `${blur.toFixed(2)}px`)
          entry.classList.toggle('is-near', depth > (compact ? 0.48 : 0.52))
          if (depth > frontDepth) {
            frontDepth = depth
            frontIndex = index
          }
        })

        orbit.style.setProperty('--core-opacity', (0.9 + Math.sin(Math.PI * easedProgress) * 0.1).toFixed(3))
        orbit.style.setProperty('--core-scale', (1 + Math.sin(Math.PI * easedProgress) * 0.035).toFixed(3))
        if (frontIndex !== activeIndex) {
          entries.forEach((entry, index) => entry.classList.toggle('is-active', index === frontIndex))
          const activeTitle = section.querySelector('.service-orbit__active-title')
          if (activeTitle) activeTitle.textContent = services[frontIndex].title
          activeIndex = frontIndex
        }
      }

      const orbitState = { progress: 0 }
      const setAmbientMotion = (isActive) => {
        ambientCards.forEach((card) => card.classList.toggle('service-entry__ambient--drifting', isActive))
      }
      renderOrbit(0)

      gsap.timeline({
        scrollTrigger: {
          trigger: compact ? orbit : stage,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * (compact ? (mobile ? 1.25 : 1.45) : 2.6))}`,
          pin: compact ? orbit : stage,
          pinSpacing: true,
          scrub: compact ? 0.75 : 1.1,
          anticipatePin: compact ? 0 : 1,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            orbitState.progress = self.progress
            renderOrbit(self.progress)
          },
          onLeave: () => {
            orbitState.progress = 1
            renderOrbit(1)
            section.classList.add('orbit-settled')
            setAmbientMotion(true)
          },
          onEnterBack: () => {
            section.classList.remove('orbit-settled')
            setAmbientMotion(false)
          },
          onLeaveBack: () => {
            section.classList.remove('orbit-settled')
            setAmbientMotion(false)
            renderOrbit(0)
          },
        },
      }).to(orbitState, {
        progress: 1,
        duration: 1,
        ease: 'none',
        onUpdate: () => renderOrbit(orbitState.progress),
      })

      return () => {
        setAmbientMotion(false)
        section.classList.remove('orbit-settled')
        section.classList.remove('has-orbit-motion')
      }
    }

    responsiveMotion.add('(min-width: 1001px)', () => {
      gsap.fromTo('.what-we-do__title-line',
        { yPercent: 110, rotateX: -8 },
        {
          yPercent: 0,
          rotateX: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: stage, start: 'top 78%', once: true },
        },
      )
      return createOrbitSequence()
    })

    responsiveMotion.add({
      tablet: '(min-width: 761px) and (max-width: 1000px)',
      mobile: '(max-width: 760px)',
    }, (context) => {
      const { mobile } = context.conditions

      gsap.fromTo('.what-we-do__title-line',
        { yPercent: 38, autoAlpha: 0.72 },
        {
          yPercent: 0,
          autoAlpha: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: {
            trigger: stage,
            start: 'top 88%',
            end: 'top 54%',
            scrub: 0.55,
            invalidateOnRefresh: true,
          },
        },
      )
      return createOrbitSequence({ compact: true, mobile })
    })

    return () => responsiveMotion.revert()
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className={`what-we-do${reducedMotion ? ' is-static' : ''}`} ref={sectionRef}>
      <div className="service-stage" id="services" ref={stageRef}>
        <div className="service-stage__head section-wrap">
          <SectionKicker number="02" label="WHAT WE DO" aside="SIX DISCIPLINES / ONE STANDARD" className="reveal" />
          <div className="what-we-do__heading">
            <div className="what-we-do__title">
              <p className="eyebrow">CAPABILITIES / MADE TO CONNECT</p>
              <h2 aria-label="Build the whole. Mind every detail.">
                <span className="what-we-do__title-line">Build the whole.</span>
                <span className="what-we-do__title-line what-we-do__title-line--muted">Mind every detail.</span>
              </h2>
            </div>
            <p className="what-we-do__intro">A connected set of disciplines, shaped around the problem — not a package. From first principles to reliable foundations.</p>
          </div>
        </div>
        <div className="service-orbit" aria-label="Scroll to explore Devcore's six service disciplines">
          <div className="service-orbit__guide service-orbit__guide--one" aria-hidden="true" />
          <div className="service-orbit__guide service-orbit__guide--two" aria-hidden="true" />
          <div className="service-orbit__core" aria-hidden="true"><span>CONNECTED</span><strong>BY DESIGN</strong><i>PRODUCT / SYSTEM / EXPERIENCE</i></div>
          <div className="service-orbit__track">
            {services.map(({ number, icon: Icon, title, description, tags, visual, className, label }, index) => (
              <article
                className={`service-entry ${className}`}
                key={number}
                data-spotlight
                style={{ '--service-index': index }}
              >
                <div className="service-entry__ambient">
                  <div className="service-entry__head">
                    <span>{number} / 06 <i>{label}</i></span>
                    <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <ServicePreview type={visual} />
                  <div className="service-entry__body">
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                    <a href="#contact" aria-label={`Discuss ${title}`} data-cursor-label="DISCUSS"><ArrowUpRight size={16} /></a>
                  </div>
                  <div className="service-entry__tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
              </article>
            ))}
          </div>
          <div className="service-orbit__readout" aria-live="polite"><span>IN FOCUS</span><strong className="service-orbit__active-title">{services[0].title}</strong></div>
        </div>
        <div className="what-we-do__footer"><span>PRODUCT / INTELLIGENCE / SYSTEMS</span><span className="service-orbit__scroll-hint">SCROLL TO ROTATE THE SYSTEM</span></div>
      </div>
      <div className="service-gallery service-gallery--static section-wrap" aria-label="Devcore service disciplines">
        {services.map(({ number, icon: Icon, title, description, tags, visual, className, label }) => (
          <article className={`service-entry ${className}`} key={number} data-spotlight>
            <div className="service-entry__ambient">
              <div className="service-entry__head">
                <span>{number} / 06 <i>{label}</i></span>
                <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <ServicePreview type={visual} />
              <div className="service-entry__body">
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <a href="#contact" aria-label={`Discuss ${title}`} data-cursor-label="DISCUSS"><ArrowUpRight size={16} /></a>
              </div>
              <div className="service-entry__tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

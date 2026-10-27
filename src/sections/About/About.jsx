import { useRef } from 'react'
import { ArrowDownRight } from 'lucide-react'
import SectionKicker from '../../components/ui/SectionKicker.jsx'
import { gsap, useGSAP } from '../../lib/gsap.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import './About.css'

export default function About() {
  const sectionRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (reducedMotion) return

    const distance = (value) => () => value * (window.innerWidth <= 760 ? 0.4 : window.innerWidth <= 1000 ? 0.7 : 1)
    gsap.fromTo('.about-oversized',
      {
        xPercent: distance(-2.2),
        yPercent: distance(8),
        rotationZ: distance(-0.3),
      },
      {
        xPercent: distance(2.2),
        yPercent: distance(-8),
        rotationZ: distance(0.3),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      },
    )
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="intro section-wrap" id="about" ref={sectionRef}>
      <SectionKicker number="01" label="THE STUDIO" className="reveal" />
      <div className="intro-grid">
        <div className="intro-statement reveal">
          <p className="eyebrow">THOUGHTFUL FROM THE FIRST PRINCIPLE</p>
          <h2>Good software<br />should feel <span>inevitable.</span></h2>
        </div>
        <div className="intro-copy reveal">
          <p>We’re an independent software studio partnering with ambitious teams to turn complex ideas into useful, carefully made products.</p>
          <p>From the first sketch to the last line of code, we bring product thinking, design craft, and engineering together.</p>
          <a className="text-link" href="#process">A little about how we work <ArrowDownRight size={16} /></a>
        </div>
      </div>
      <div className="about-oversized" aria-hidden="true">IDEAS <span>→</span> INTERFACES <span>→</span> IMPACT</div>
      <div className="intro-signature reveal"><span>LESS NOISE. MORE INTENTION.</span><div className="signature-line" /><span>SMALL TEAM, END-TO-END CRAFT</span></div>
    </section>
  )
}

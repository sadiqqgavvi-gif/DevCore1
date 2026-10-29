import { Fragment, useRef } from 'react'
import LiquidSculpture from '../components/ui/LiquidSculpture.jsx'
import { gsap, useGSAP } from '../lib/gsap.js'
import { houseRules } from './data.js'

const TITLE = 'Making Digital Products More Thoughtful, Useful, and Alive'

// Chapter 04, second half: the DevCore Gazette as an editorial spread. Fig. 1 (design and
// engineering, overlapping) is a liquid particle sculpture that condenses as the feature spread
// arrives; the articles reveal beside it as they are read.
export function Gazette({ reducedMotion }) {
  const sectionRef = useRef(null)
  // Read by the sculpture on every frame it draws; written only by the scroll timeline below.
  const sculptRef = useRef({ form: 1, spin: 0.2 })

  useGSAP(() => {
    const state = sculptRef.current
    if (reducedMotion) {
      state.form = 1
      state.spin = 0.2
      return
    }
    const section = sectionRef.current
    const once = (trigger, start = 'top 86%') => ({ trigger, start, once: true })

    // 1. The masthead's rules draw, then the headline rises word by word.
    gsap.fromTo('.gz-masthead', { '--rule': 0 }, { '--rule': 1, duration: 1.1, ease: 'power3.inOut', scrollTrigger: once('.gz-masthead', 'top 90%') })
    gsap.fromTo('.gz-masthead > *, .gz-edition', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.7, ease: 'power3.out', scrollTrigger: once('.gz-masthead', 'top 90%') })
    gsap.fromTo('.gz-title .word > span', { yPercent: 110 }, { yPercent: 0, stagger: 0.045, duration: 0.95, ease: 'power3.out', scrollTrigger: once('.gz-title') })

    // 2. The sculpture condenses from a liquid cloud as the spread arrives, and keeps turning
    //    with scroll through the whole chapter. Both are scrubbed, so reverse scrolling unwinds.
    state.form = 0
    state.spin = 0
    gsap.to(state, { form: 1, ease: 'none', scrollTrigger: { trigger: '.gz-spread', start: 'top 85%', end: 'top 10%', scrub: 0.8 } })
    gsap.to(state, { spin: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 } })
    gsap.fromTo('.gz-fig__label', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: '.gz-spread', start: 'top 35%', end: 'top 5%', scrub: 0.6 } })
    gsap.fromTo('.gz-stage__halo', { scale: 0.8, autoAlpha: 0.2 }, { scale: 1.12, autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: '.gz-spread', start: 'top bottom', end: 'bottom top', scrub: 1 } })

    // 3. Articles arrive in sequence as they come into view (and leave again on the way back up).
    gsap.utils.toArray('.gz-article', section).forEach((article) => {
      gsap.fromTo(article, { y: 56, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: article, start: 'top 88%', toggleActions: 'play none none reverse' },
      })
    })

    // 4. The statement: lines rise out of their masks, then drift at different speeds.
    gsap.fromTo('.gz-statement > span > span', { yPercent: 105 }, { yPercent: 0, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: once('.gz-statement', 'top 82%') })
    gsap.utils.toArray('.gz-statement > span', section).forEach((line, index) => {
      gsap.fromTo(line, { xPercent: (1 - index) * 5 }, { xPercent: (index - 1) * 5, ease: 'none', scrollTrigger: { trigger: '.gz-statement', start: 'top bottom', end: 'bottom top', scrub: 0.8 } })
    })

    // 5. Studio philosophy: cards stagger in; the numerals sit at a different depth.
    gsap.fromTo('.gz-rules li', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out', scrollTrigger: once('.gz-rules ol', 'top 85%') })
    gsap.fromTo('.gz-rules b', { y: 24 }, { y: -24, ease: 'none', scrollTrigger: { trigger: '.gz-rules', start: 'top bottom', end: 'bottom top', scrub: 0.8 } })

    // 6. Leaving: the last spread settles back as the next chapter arrives.
    gsap.fromTo('.gz-rules', { scale: 1, autoAlpha: 1 }, { scale: 0.97, autoAlpha: 0.55, ease: 'none', scrollTrigger: { trigger: section, start: 'bottom 75%', end: 'bottom top', scrub: 0.8 } })
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  return (
    <section className="gazette" id="studio" ref={sectionRef} aria-labelledby="story-title">
      <header className="gz-intro">
        <div className="gz-masthead">
          <span>VOL. 01</span>
          <strong>The DevCore Gazette</strong>
          <span>PRICE: ONE GOOD CONVERSATION</span>
        </div>
        <p className="gz-edition">STUDIO EDITION · WHAT WE BUILD · HOW WE THINK · WHY IT MATTERS</p>
        <h2 id="story-title" className="gz-title" aria-label={TITLE}>
          {TITLE.split(' ').map((word, index) => <Fragment key={index}>{index > 0 && ' '}<span className="word" aria-hidden="true"><span>{word}</span></span></Fragment>)}
        </h2>
      </header>

      <div className="gz-spread">
        <figure className="gz-stage">
          <span className="gz-stage__halo" aria-hidden="true" />
          <div className="gz-figure">
            <LiquidSculpture stateRef={sculptRef} className="gz-sculpture" label="Diagram: design and engineering overlap, and DevCore works in the overlap" />
            <span className="gz-fig__label gz-fig__label--design" aria-hidden="true">Design</span>
            <span className="gz-fig__label gz-fig__label--engineering" aria-hidden="true">Engineering</span>
            <span className="gz-fig__label gz-fig__label--core" aria-hidden="true">DEVCORE</span>
          </div>
          <figcaption>
            Fig. 1 — Where the work happens.
            <span className="gz-fig__note">&larr; no handoffs, no lost details</span>
          </figcaption>
        </figure>

        <div className="gz-articles">
          <article className="gz-article">
            <p className="gz-article__no">No. 01</p>
            <h3>What we build</h3>
            <p className="gz-dropcap">DevCore is an independent software studio that designs and builds digital products, intelligent systems and experiences for the web. Small by design, serious about craft, and working with ambitious teams wherever they happen to be.</p>
          </article>
          <article className="gz-article">
            <p className="gz-article__no">No. 02</p>
            <h3>How we solve problems</h3>
            <p>We start with the problem, not the tool. Before adding layers, frameworks or features, we make sure we understand who the product is for and what would make their day easier.</p>
          </article>
          <blockquote className="gz-article gz-quote">
            <p>&ldquo;Less noise. More intention.&rdquo;</p>
            <cite>— The DevCore house motto</cite>
          </blockquote>
          <article className="gz-article">
            <p className="gz-article__no">No. 03</p>
            <h3>Design and engineering, together</h3>
            <p>From the first sketch to the last line of code, the same small team carries the work. Nothing gets lost in a handoff, because there isn&rsquo;t one. We&rsquo;re not your regular IT department. We don&rsquo;t reboot the fax machine.</p>
          </article>
          <aside className="gz-article gz-brief" aria-label="Studio at a glance">
            <h4>In brief</h4>
            <ul>
              <li>Small team, end-to-end craft</li>
              <li>Strategy · Design · Engineering</li>
              <li>Built to evolve, ready for what changes</li>
            </ul>
          </aside>
        </div>
      </div>

      <p className="gz-statement" aria-label="Good software should feel inevitable.">
        <span aria-hidden="true"><span>Good software</span></span>
        <span aria-hidden="true"><span>should feel</span></span>
        <span aria-hidden="true"><span><em>inevitable.</em></span></span>
      </p>

      <div className="gz-rules">
        <h3 className="gz-rules__head"><span>Editorial</span> Studio Philosophy</h3>
        <ol>
          {houseRules.map(([numeral, title, description]) => (
            <li key={numeral}><b>{numeral}</b><div><h4>{title}</h4><p>{description}</p></div></li>
          ))}
        </ol>
      </div>
      <span className="gz-exit" aria-hidden="true" />
    </section>
  )
}

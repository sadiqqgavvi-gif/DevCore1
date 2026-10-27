import { useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, MoveUpRight } from 'lucide-react'
import SectionKicker from '../../components/ui/SectionKicker.jsx'
import { gsap, useGSAP } from '../../lib/gsap.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import './Contact.css'

function ConnectionSignal() {
  return (
    <div className="contact-signal" aria-hidden="true">
      <div className="contact-signal__orbit-layer contact-signal__orbit-layer--outer">
        <div className="contact-signal__orbit contact-signal__orbit--outer" />
      </div>
      <div className="contact-signal__orbit-layer contact-signal__orbit-layer--middle">
        <div className="contact-signal__orbit contact-signal__orbit--middle" />
      </div>
      <div className="contact-signal__orbit-layer contact-signal__orbit-layer--inner">
        <div className="contact-signal__orbit contact-signal__orbit--inner" />
      </div>
      <svg className="contact-signal__network" viewBox="0 0 540 440">
        <path d="M75 310 180 228 264 265 365 154 464 202" />
        <path d="m180 228 45-126 140 52M264 265l29 112 171-175" />
        <circle cx="75" cy="310" r="5" /><circle cx="180" cy="228" r="7" />
        <circle cx="264" cy="265" r="5" /><circle cx="365" cy="154" r="7" />
        <circle cx="464" cy="202" r="5" /><circle cx="225" cy="102" r="4" />
        <circle cx="293" cy="377" r="4" />
      </svg>
      <div className="contact-signal__core-layer">
        <div className="contact-signal__core"><span>DEVCORE</span><strong>OPEN<br />CHANNEL</strong><i>READY WHEN YOU ARE</i></div>
      </div>
      <span className="contact-signal__label contact-signal__label--top">A THOUGHT / AN IDEA / A FIRST STEP</span>
      <span className="contact-signal__label contact-signal__label--bottom">CONNECTION ESTABLISHED <i>↗</i></span>
    </div>
  )
}

export default function Contact() {
  const sectionRef = useRef(null)
  const [formState, setFormState] = useState('idle')
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (reducedMotion) {
      gsap.set('.contact-final__kicker, .contact-signal, .contact-final__title-line, .contact-final__copy, .contact-form', {
        autoAlpha: 1,
        clearProps: 'transform,filter',
      })
      return
    }
    const entrance = gsap.timeline({
      scrollTrigger: { trigger: sectionRef.current, start: 'top 68%', once: true },
    })
    entrance
      .fromTo('.contact-final__kicker', { autoAlpha: 0, x: -18 }, { autoAlpha: 1, x: 0, duration: 0.6 })
      .fromTo('.contact-signal', { autoAlpha: 0, scale: 0.88, rotateY: -9 }, { autoAlpha: 1, scale: 1, rotateY: 0, duration: 1 }, '-=0.25')
      .fromTo('.contact-final__title-line', { yPercent: 110, rotateX: -8 }, { yPercent: 0, rotateX: 0, duration: 0.75, stagger: 0.12 }, '-=0.48')
      .fromTo('.contact-final__copy, .contact-form', { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.14 }, '-=0.2')

    const distance = (value) => () => value * (window.innerWidth > 760 ? 1 : 0.45)
    const outer = sectionRef.current.querySelector('.contact-signal__orbit-layer--outer')
    const middle = sectionRef.current.querySelector('.contact-signal__orbit-layer--middle')
    const inner = sectionRef.current.querySelector('.contact-signal__orbit-layer--inner')
    const core = sectionRef.current.querySelector('.contact-signal__core-layer')
    const network = sectionRef.current.querySelector('.contact-signal__network')
    const paths = network.querySelectorAll('path')
    const depth = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.85,
        invalidateOnRefresh: true,
      },
    })

    depth
      .fromTo(outer,
        { x: distance(-20), y: distance(12), z: distance(-24), rotationZ: distance(-1.2) },
        { x: distance(18), y: distance(-10), z: distance(18), rotationZ: distance(1.4), ease: 'none' },
        0,
      )
      .fromTo(middle,
        { x: distance(14), y: distance(-10), z: distance(16), rotationZ: distance(1.1) },
        { x: distance(-16), y: distance(12), z: distance(-12), rotationZ: distance(-1.2), ease: 'none' },
        0,
      )
      .fromTo(inner,
        { x: distance(-8), y: distance(-5), z: distance(-8) },
        { x: distance(10), y: distance(7), z: distance(12), ease: 'none' },
        0,
      )
      .fromTo(network,
        { x: distance(8), y: distance(10), z: distance(-8) },
        { x: distance(-9), y: distance(-7), z: distance(12), ease: 'none' },
        0,
      )
      .fromTo(paths,
        { strokeDashoffset: 12 },
        { strokeDashoffset: -12, ease: 'none' },
        0,
      )
      .fromTo(core,
        { y: distance(10), z: distance(-10), scale: () => 1 - (0.03 * (window.innerWidth > 760 ? 1 : 0.45)) },
        { y: distance(-12), z: distance(24), scale: () => 1 + (0.035 * (window.innerWidth > 760 ? 1 : 0.45)), ease: 'none' },
        0,
      )
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  useEffect(() => {
    const section = sectionRef.current
    if (!section || reducedMotion || !window.matchMedia('(pointer: fine)').matches) return undefined

    const handlePointerMove = (event) => {
      const bounds = section.getBoundingClientRect()
      section.style.setProperty('--contact-pointer-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`)
      section.style.setProperty('--contact-pointer-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`)
    }
    section.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => section.removeEventListener('pointermove', handlePointerMove)
  }, [reducedMotion])

  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const projectType = String(formData.get('project-type') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const subject = encodeURIComponent(`${projectType} enquiry from ${name}`)
    const body = encodeURIComponent(`${description}\n\nProject type: ${projectType}\n\n${name}\n${email}`)
    window.location.href = `mailto:hello@devcore.studio?subject=${subject}&body=${body}`
    setFormState('email-opened')
  }

  return (
    <section className="contact-final section-wrap" id="contact" ref={sectionRef}>
      <SectionKicker number="07" label="START A CONVERSATION" aside="A GOOD PLACE TO BEGIN" className="contact-final__kicker reveal" />
      <div className="contact-final__layout">
        <div className="contact-final__story">
          <ConnectionSignal />
          <div className="contact-final__copy">
            <p className="eyebrow"><span className="status-dot" /> OPEN TO THE RIGHT THING</p>
            <h2 aria-label="Have a good one in mind?">
              <span className="contact-final__title-line">Have a good</span>
              <span className="contact-final__title-line">one in <em>mind?</em></span>
            </h2>
            <p>Tell us what you’re thinking about. We’ll take it from there — thoughtfully, and without the hard sell.</p>
            <a className="contact-final__email" href="mailto:hello@devcore.studio">
              hello@devcore.studio <MoveUpRight size={16} />
            </a>
          </div>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form__heading">
            <span>PROJECT ENQUIRY / 01</span>
            <p>A few details to get us started.</p>
          </div>
          <label htmlFor="contact-name">YOUR NAME
            <input id="contact-name" name="name" type="text" autoComplete="name" placeholder="How should we address you?" required />
          </label>
          <label htmlFor="contact-email">EMAIL ADDRESS
            <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="Where can we reach you?" required />
          </label>
          <label htmlFor="contact-project-type">WHAT ARE YOU THINKING ABOUT?
            <select id="contact-project-type" name="project-type" defaultValue="" required>
              <option value="" disabled>Select a project type</option>
              <option value="Digital product">Digital product</option>
              <option value="Applied AI">Applied AI</option>
              <option value="Custom system">Custom system</option>
              <option value="Product design">Product design</option>
              <option value="Something else">Something else</option>
            </select>
          </label>
          <label htmlFor="contact-description">A LITTLE ABOUT THE PROJECT
            <textarea id="contact-description" name="description" rows="3" placeholder="What are you looking to make?" required />
          </label>
          <button className="contact-submit" type="submit" data-cursor-label="OPEN EMAIL">
            <span>Open email to send</span><ArrowUpRight size={16} />
          </button>
          <p className="contact-form__note" aria-live="polite">
            {formState === 'email-opened'
              ? 'Your email app should open with the message ready to send. It has not been sent automatically.'
              : 'Your email app will open with your message. Nothing is stored here.'}
          </p>
        </form>
      </div>
      <div className="contact-final__foot"><span>ONE GOOD CONVERSATION CAN CHANGE THE SHAPE OF A PROJECT.</span><a href="#home">BACK TO THE BEGINNING <ArrowDownRight size={14} /></a></div>
    </section>
  )
}

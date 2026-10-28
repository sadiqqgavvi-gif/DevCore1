import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, requestScrollRefresh } from '../../lib/gsap.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import './ChapterTransitions.css'

const chapters = [
  { selector: '#about', number: '01', title: 'THE STUDIO' },
  { selector: '.what-we-do', number: '02', title: 'WHAT WE DO' },
  { selector: '#work', number: '03', title: 'SELECTED WORK' },
  { selector: '#process', number: '04', title: 'HOW WE WORK' },
  { selector: '#technology', number: '05', title: 'THE TOOLKIT' },
  { selector: '#principles', number: '06', title: 'WHY DEVCORE' },
  { selector: '#contact', number: '07', title: 'CONTACT' },
]

export default function ChapterTransitions({ rootRef }) {
  const transitionRef = useRef(null)
  const numberRef = useRef(null)
  const titleRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    const frame = transitionRef.current
    if (!root || !frame || reducedMotion) return

    let disposed = false

    const updateLabel = (chapter) => {
      numberRef.current.textContent = chapter.number
      titleRef.current.textContent = chapter.title
    }

    const hideTransition = () => {
      gsap.set(frame, { autoAlpha: 0 })
      frame.parentElement.style.setProperty('--chapter-shade', '0')
    }

    const updateTransition = (chapter, self) => {
      if (self.progress <= 0 || self.progress >= 1) {
        hideTransition()
        return
      }

      updateLabel(chapter)
      const progress = self.progress
      const fadeIn = gsap.utils.clamp(0, 1, progress / 0.2)
      const fadeOut = gsap.utils.clamp(0, 1, (1 - progress) / 0.26)
      const opacity = Math.min(fadeIn, fadeOut)
      const shade = Math.sin(progress * Math.PI) * opacity
      gsap.set(frame, {
        autoAlpha: opacity,
        y: gsap.utils.interpolate(18, -4, progress),
        scale: gsap.utils.interpolate(0.985, 1.005, progress),
        rotateX: gsap.utils.interpolate(2, 0, progress),
      })
      frame.parentElement.style.setProperty('--chapter-shade', shade.toFixed(3))
    }

    const triggers = chapters.flatMap((chapter) => {
      const section = root.querySelector(chapter.selector)
      if (!section) return []

      return [ScrollTrigger.create({
        trigger: section,
        start: 'top 86%',
        end: 'top 38%',
        onEnter: (self) => updateTransition(chapter, self),
        onEnterBack: (self) => updateTransition(chapter, self),
        onUpdate: (self) => updateTransition(chapter, self),
        onLeave: () => {
          if (titleRef.current.textContent === chapter.title) hideTransition()
        },
        onLeaveBack: () => {
          if (titleRef.current.textContent === chapter.title) hideTransition()
        },
        onRefresh: (self) => {
          if (self.progress > 0 && self.progress < 1) updateTransition(chapter, self)
          else if (titleRef.current.textContent === chapter.title) hideTransition()
        },
      })]
    })

    // Sections build their pins after mount and fonts change layout; one debounced refresh
    // (shared with every other caller) replaces the previous trio of independent refreshes.
    requestScrollRefresh(80)
    document.fonts.ready.then(() => {
      if (!disposed) requestScrollRefresh()
    })

    return () => {
      disposed = true
      triggers.forEach((trigger) => trigger.kill())
    }
  }, [reducedMotion, rootRef])

  return (
    <div className="chapter-transition" ref={transitionRef} aria-hidden="true">
      <div className="chapter-transition__frame">
        <span className="chapter-transition__index" ref={numberRef}>01</span>
        <span className="chapter-transition__rule" />
        <strong className="chapter-transition__title" ref={titleRef}>THE STUDIO</strong>
        <span className="chapter-transition__signal">DEVCORE / NEXT CHAPTER</span>
      </div>
    </div>
  )
}

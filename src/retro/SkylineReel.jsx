import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { gsap, useGSAP } from '../lib/gsap.js'
import { EMAIL } from './data.js'

// The original 21st.dev "sunset skyline" assets, used exactly as supplied: an 8 s cinematic
// film and a transparent cut-out of its final skyline, laid over the film so the buildings
// stand in front of the brand mark.
const FILM_SRC = 'https://cdn.21st.dev/assets/mirror/23/234bc821170e75a6b8d2e42a952078f858eb054a51fab2a5baa928a10fdc245d.mp4'
const SKYLINE_SRC = 'https://cdn.21st.dev/assets/mirror/97/97fe4402ea1d5d05c2b82befe6dbf73da1d6669b995e6d5ae9f2ebea68b1107a.png'

// Pinned scroll distance, in viewport heights, and the share of it that plays the film.
// The rest resolves into the brand mark, the skyline and the call to action.
const PIN_SCREENS = 3.6
const FILM_END = 0.64
// Never seek past the last decodable frame, and skip seeks smaller than half a frame (24 fps).
const END_GUARD = 0.05
const SEEK_EPSILON = 1 / 48
// Past this point of the pin the call to action is visible and takes pointer input.
const CTA_LIVE = 0.9

function formatTime(seconds) {
  return `00:${seconds.toFixed(1).padStart(4, '0')}`
}

export default function SkylineReel({ reducedMotion }) {
  const sectionRef = useRef(null)
  const filmRef = useRef(null)
  const timeRef = useRef(null)
  const triggerRef = useRef(null)
  // Shared with the scroll timeline: the wanted playback fraction and the seek entry point.
  const scrubRef = useRef({ fraction: 0, seek: null })
  const [near, setNear] = useState(false)
  const [film, setFilm] = useState('idle')
  const [skyline, setSkyline] = useState('idle')

  // The film (3.2 MB) and skyline (1.6 MB) only start loading once the chapter is close.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      setNear(true)
      observer.disconnect()
    }, { rootMargin: '200% 0px' })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // Scroll-to-time engine. The film has a single keyframe, so every seek decodes from the
  // start: seeks are serialised (one in flight, the latest target wins on 'seeked') and no
  // time is computed until the duration is known and valid. The film never plays on its own.
  useEffect(() => {
    const video = filmRef.current
    if (!video || !near) return undefined
    const scrub = scrubRef.current
    let duration = 0
    let primed = false
    let live = true
    const apply = () => {
      if (!duration || video.seeking) return
      const time = Math.min(duration - END_GUARD, Math.max(0, scrub.fraction * duration))
      if (timeRef.current) timeRef.current.textContent = `${formatTime(time)} / ${formatTime(duration)}`
      if (Math.abs(video.currentTime - time) < SEEK_EPSILON) return
      try {
        video.currentTime = time
      } catch {
        // A seek can be refused mid-load; the next 'seeked' / 'canplay' retries it.
      }
    }
    const onMetadata = () => {
      if (!live || !Number.isFinite(video.duration) || video.duration <= 0) return
      duration = video.duration
      if (reducedMotion) scrub.fraction = 1
      setFilm('ready')
      // Some mobile browsers only buffer frames after a play(): start and stop at once.
      if (!primed && video.readyState < 2) {
        primed = true
        video.play()?.then(() => { video.pause(); apply() }).catch(() => {})
      }
      apply()
    }
    const onError = () => setFilm('failed')
    const onPlay = () => { if (primed) video.pause() }
    scrub.seek = (fraction) => {
      scrub.fraction = fraction
      apply()
    }
    video.addEventListener('loadedmetadata', onMetadata)
    video.addEventListener('seeked', apply)
    video.addEventListener('canplay', apply)
    video.addEventListener('play', onPlay)
    video.addEventListener('error', onError)
    // Metadata may already be in when this effect re-runs (e.g. a reduced-motion switch).
    Promise.resolve().then(() => { if (video.readyState >= 1) onMetadata() })
    return () => {
      live = false
      scrub.seek = null
      video.removeEventListener('loadedmetadata', onMetadata)
      video.removeEventListener('seeked', apply)
      video.removeEventListener('canplay', apply)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('error', onError)
    }
  }, [near, reducedMotion])

  useGSAP(() => {
    // Reduced motion: no pin and no scrub; the CSS shows the finished composition.
    if (reducedMotion) return
    const section = sectionRef.current
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * PIN_SCREENS)}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
      // Driven by the smoothed timeline, so the film and the layers always agree.
      onUpdate: () => {
        // Record the target even before the film has loaded, so its first frame matches the
        // scroll position (a deep link or a fast scroll can arrive mid-reel).
        const fraction = Math.min(1, tl.progress() / FILM_END)
        scrubRef.current.fraction = fraction
        scrubRef.current.seek?.(fraction)
        section.classList.toggle('is-resolved', tl.progress() > CTA_LIVE)
      },
    })
    triggerRef.current = tl.scrollTrigger
    tl.set({}, {}, 1)
      .fromTo('.reel__bar i', { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      // A: the opening frame lifts away as the film starts to roll.
      .to('.reel__hint', { autoAlpha: 0, duration: 0.05 }, 0.02)
      .to('.reel__open', { opacity: 0, yPercent: -40, filter: 'blur(10px)', duration: 0.16 }, 0.06)
      .fromTo('.reel__veil', { autoAlpha: 1 }, { autoAlpha: 0.35, duration: 0.5 }, 0)
      // C: the brand mark condenses out of the light near the end of the film.
      .fromTo('.reel__mark', { autoAlpha: 0, yPercent: 30, scale: 1.2, filter: 'blur(18px)', letterSpacing: '0.42em' },
        { autoAlpha: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', letterSpacing: '0.03em', duration: 0.2, ease: 'power2.out' }, 0.44)
      // Once sharp, drop the filter so the mark is not kept on its own compositing layer.
      .set('.reel__mark', { filter: 'none' }, 0.641)
      // D: the original skyline settles in front of the mark, exactly over the film.
      .fromTo('.reel__skyline', { autoAlpha: 0, yPercent: 4 }, { autoAlpha: 1, yPercent: 0, duration: 0.16, ease: 'power1.out' }, 0.62)
      // E: the mark rises out of the way and the call to action resolves below it.
      .to('.reel__mark', { yPercent: -34, scale: 0.78, duration: 0.14, ease: 'power1.inOut' }, 0.8)
      .fromTo('.reel__scrim', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.78)
      .fromTo('.reel__cta > *', { opacity: 0, y: 28 }, { opacity: 1, y: 0, stagger: 0.025, duration: 0.1, ease: 'power2.out' }, 0.84)
    return () => {
      triggerRef.current = null
      section.classList.remove('is-resolved')
    }
  }, { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true })

  // The opening heading and the call to action fade with opacity only, so they stay in the
  // accessibility tree. If keyboard focus reaches the call to action before the reel has
  // resolved, jump to the finished frame instead of focusing something invisible.
  const revealForFocus = () => {
    const trigger = triggerRef.current
    if (trigger && trigger.progress < 0.99) window.scrollTo({ top: trigger.end, behavior: 'auto' })
  }

  const classes = ['reel', reducedMotion ? 'is-static' : '', film === 'ready' ? 'has-film' : '', film === 'failed' ? 'is-film-failed' : '', skyline === 'failed' ? 'is-skyline-failed' : '']

  return (
    <section className={classes.filter(Boolean).join(' ')} id="reel" ref={sectionRef} aria-labelledby="reel-title">
      <div className="reel__stage">
        <video
          ref={filmRef}
          className="reel__film"
          src={near ? FILM_SRC : undefined}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
        />
        <span className="reel__veil" aria-hidden="true" />

        <div className="reel__open">
          <p className="kicker">Chapter 11 — Start a project</p>
          <h2 id="reel-title" className="glow">Picture what&rsquo;s next.</h2>
          <p className="reel__lede">One last reel. Scroll to roll it.</p>
        </div>

        <p className="reel__mark">
          <span>Ideas into</span>
          <span>engineered reality.</span>
        </p>

        {skyline !== 'failed' && (
          <img
            className="reel__skyline"
            src={near ? SKYLINE_SRC : undefined}
            alt=""
            aria-hidden="true"
            decoding="async"
            onLoad={() => setSkyline('ready')}
            onError={() => setSkyline('failed')}
          />
        )}
        <span className="reel__scrim" aria-hidden="true" />

        <div className="reel__cta" onFocus={revealForFocus}>
          <h3>Start something extraordinary.</h3>
          <p>Bring the idea. We&rsquo;ll design and engineer it into a product people can rely on.</p>
          <div className="reel__actions">
            <a className="button-cream" href={`mailto:${EMAIL}?subject=${encodeURIComponent('Project enquiry')}`}>Start a project <ArrowRight size={15} /></a>
            <a className="reel__mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </div>
        </div>

        <div className="reel__hud">
          <span className="reel__hint" aria-hidden="true"><ArrowDown size={14} /> Scroll to roll</span>
          <span className="reel__time" ref={timeRef} aria-hidden="true">REEL 11</span>
          <span className="reel__bar" aria-hidden="true"><i /></span>
        </div>
      </div>
    </section>
  )
}

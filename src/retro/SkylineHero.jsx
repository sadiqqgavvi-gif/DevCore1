import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { gsap, useGSAP } from '../lib/gsap.js'
import { DESKTOP_MOTION } from './motionModes.js'

// The 21st.dev "sunset skyline" assets: an 8 s cinematic film and a transparent cut-out of its
// final skyline, laid over the film so the buildings stand in front of the brand mark.
const FILM_SRC = 'https://cdn.21st.dev/assets/mirror/23/234bc821170e75a6b8d2e42a952078f858eb054a51fab2a5baa928a10fdc245d.mp4'
const SKYLINE_SRC = 'https://cdn.21st.dev/assets/mirror/97/97fe4402ea1d5d05c2b82befe6dbf73da1d6669b995e6d5ae9f2ebea68b1107a.png'

// Desktop: pinned scroll distance (viewport heights) and the share of it that plays the film.
const PIN_SCREENS = 2.6
const FILM_END = 0.7
// Phones and tablets: the film plays through once; the skyline and mark arrive near its end.
const REVEAL_AT = 0.68
// Never seek past the last decodable frame, and skip seeks smaller than half a frame (24 fps).
const END_GUARD = 0.05
const SEEK_EPSILON = 1 / 48

function formatTime(seconds) {
  return `00:${seconds.toFixed(1).padStart(4, '0')}`
}

/**
 * The opening of the page. Three ways to play the same film:
 *  - scrub (desktop): the section pins and scroll drives the film, then the brand mark and the
 *    skyline. ScrollTrigger pins it, so native scrolling is never intercepted.
 *  - play (phones, tablets, short screens): no pin. The muted film plays through once while the
 *    hero is on screen and the skyline settles in at the end; the page scrolls normally.
 *  - still (reduced motion): the finished frame, nothing moves.
 * If the film fails, a dusk gradient holds the frame; the copy and the actions never depend on it.
 */
export default function SkylineHero({ reducedMotion, introDelay }) {
  const desktop = useMediaQuery(DESKTOP_MOTION)
  const mode = reducedMotion ? 'still' : desktop ? 'scrub' : 'play'
  const sectionRef = useRef(null)
  const filmRef = useRef(null)
  const timeRef = useRef(null)
  const triggerRef = useRef(null)
  // Shared with the scroll timeline: the wanted playback fraction and the seek entry point.
  const scrubRef = useRef({ fraction: 0, seek: null })
  const [film, setFilm] = useState('idle')
  const [skyline, setSkyline] = useState('idle')

  // Film status, in every mode.
  useEffect(() => {
    const video = filmRef.current
    if (!video) return undefined
    // iOS only autoplays when the attribute (not just the property) says muted.
    video.muted = true
    video.setAttribute('muted', '')
    const onReady = () => setFilm('ready')
    const onError = () => setFilm('failed')
    video.addEventListener('loadeddata', onReady)
    video.addEventListener('error', onError)
    if (video.readyState >= 2) Promise.resolve().then(onReady)
    return () => {
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('error', onError)
    }
  }, [])

  // Scrub and still: scroll-to-time. The film has a single keyframe, so every seek decodes from
  // the start; seeks are serialised (one in flight, the latest target wins on 'seeked') and no
  // time is computed until the duration is known. The film never plays on its own here.
  useEffect(() => {
    const video = filmRef.current
    if (!video || mode === 'play') return undefined
    const scrub = scrubRef.current
    let duration = 0
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
      if (mode === 'still') scrub.fraction = 1
      apply()
    }
    video.pause()
    scrub.seek = (fraction) => {
      scrub.fraction = fraction
      apply()
    }
    video.addEventListener('loadedmetadata', onMetadata)
    video.addEventListener('seeked', apply)
    video.addEventListener('canplay', apply)
    Promise.resolve().then(() => { if (video.readyState >= 1) onMetadata() })
    return () => {
      live = false
      scrub.seek = null
      video.removeEventListener('loadedmetadata', onMetadata)
      video.removeEventListener('seeked', apply)
      video.removeEventListener('canplay', apply)
    }
  }, [mode])

  // Play: one pass of the film while the hero is visible, paused off-screen. If the browser
  // refuses autoplay (data saver, low power), settle on the last frame instead.
  useEffect(() => {
    const video = filmRef.current
    const section = sectionRef.current
    if (!video || !section || mode !== 'play') return undefined
    let live = true
    let finished = false
    let inView = false
    // Hold the film until the boot intro has cleared, so its opening is not played unseen.
    let armed = false
    const reveal = () => section.classList.add('is-revealed')
    const onTime = () => {
      const duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0) return
      const fraction = Math.min(1, video.currentTime / duration)
      section.style.setProperty('--reel-progress', fraction.toFixed(3))
      if (timeRef.current) timeRef.current.textContent = `${formatTime(video.currentTime)} / ${formatTime(duration)}`
      if (fraction >= REVEAL_AT) reveal()
    }
    const onEnded = () => {
      finished = true
      reveal()
    }
    const settleOnLastFrame = () => {
      if (!live) return
      finished = true
      const settle = () => {
        try { video.currentTime = Math.max(0, video.duration - END_GUARD) } catch { /* not seekable yet */ }
        section.style.setProperty('--reel-progress', '1')
        reveal()
      }
      if (video.readyState >= 1) settle()
      else video.addEventListener('loadedmetadata', settle, { once: true })
    }
    const sync = () => {
      if (finished || !armed) return
      if (inView) video.play()?.catch(settleOnLastFrame)
      else video.pause()
    }
    const armTimer = window.setTimeout(() => { armed = true; sync() }, introDelay * 1000)
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    }, { threshold: 0.3 })
    visibility.observe(section)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('ended', onEnded)
    return () => {
      live = false
      window.clearTimeout(armTimer)
      visibility.disconnect()
      video.pause()
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('ended', onEnded)
      section.classList.remove('is-revealed')
      section.style.removeProperty('--reel-progress')
    }
  }, [mode, introDelay])

  useGSAP(() => {
    if (mode === 'still') return
    const section = sectionRef.current
    // Entrance after the boot screen: lines rise out of their masks, then the rest follows.
    gsap.timeline({ delay: introDelay + 0.15, defaults: { ease: 'power3.out' } })
      .from('.reel__line > span', { yPercent: 110, duration: 1, stagger: 0.12 })
      .from('.reel__open .kicker, .reel__lede, .reel__actions, .reel__hud', { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, '-=0.6')

    if (mode !== 'scrub') return
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
        // scroll position (a deep link or a fast scroll can arrive mid-hero).
        const fraction = Math.min(1, tl.progress() / FILM_END)
        scrubRef.current.fraction = fraction
        scrubRef.current.seek?.(fraction)
        section.classList.toggle('is-rolling', tl.progress() > 0.08)
      },
    })
    triggerRef.current = tl.scrollTrigger
    tl.set({}, {}, 1)
      .fromTo('.reel__bar i', { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      // The opening frame lifts away as the film starts to roll.
      .to('.reel__hint', { autoAlpha: 0, duration: 0.05 }, 0.02)
      .to('.reel__open', { opacity: 0, yPercent: -30, duration: 0.16 }, 0.08)
      .fromTo('.reel__veil', { autoAlpha: 1 }, { autoAlpha: 0.35, duration: 0.5 }, 0)
      // The brand mark condenses out of the light near the end of the film.
      .fromTo('.reel__mark', { autoAlpha: 0, yPercent: 30, scale: 1.2, filter: 'blur(18px)', letterSpacing: '0.42em' },
        { autoAlpha: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', letterSpacing: '0.03em', duration: 0.2, ease: 'power2.out' }, 0.46)
      // Once sharp, drop the filter so the mark is not kept on its own compositing layer.
      .set('.reel__mark', { filter: 'none' }, 0.661)
      // The skyline settles in front of the mark, exactly over the film's last frame.
      .fromTo('.reel__skyline', { autoAlpha: 0, yPercent: 4 }, { autoAlpha: 1, yPercent: 0, duration: 0.16, ease: 'power1.out' }, 0.64)
      // Hand-off: the frame dims as the next chapter arrives.
      .fromTo('.reel__exit', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, 0.86)
    return () => {
      triggerRef.current = null
      section.classList.remove('is-rolling')
    }
  }, { scope: sectionRef, dependencies: [mode, introDelay], revertOnUpdate: true })

  // The opening copy fades with opacity only, so it stays in the accessibility tree. If keyboard
  // focus lands in it after it has faded, return to the start of the hero.
  const restoreForFocus = () => {
    const trigger = triggerRef.current
    if (trigger && trigger.progress > 0.06) window.scrollTo({ top: trigger.start, behavior: 'auto' })
  }

  const classes = ['reel', `is-${mode}`, mode === 'still' ? 'is-revealed' : '', film === 'ready' ? 'has-film' : '', film === 'failed' ? 'is-film-failed' : '']

  return (
    <section className={classes.filter(Boolean).join(' ')} id="home" ref={sectionRef} aria-labelledby="hero-title">
      <div className="reel__stage">
        <video
          ref={filmRef}
          className="reel__film"
          src={FILM_SRC}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
        />
        <span className="reel__veil" aria-hidden="true" />

        <p className="reel__mark" aria-hidden="true">
          <span>Ideas into</span>
          <span>engineered reality.</span>
        </p>
        {skyline !== 'failed' && (
          <img
            className="reel__skyline"
            src={SKYLINE_SRC}
            alt=""
            aria-hidden="true"
            decoding="async"
            onLoad={() => setSkyline('ready')}
            onError={() => setSkyline('failed')}
          />
        )}
        <span className="reel__scrim" aria-hidden="true" />

        <div className="reel__open" onFocus={restoreForFocus}>
          <p className="kicker">DevCore — Independent software studio</p>
          <h1 id="hero-title" className="reel__title glow">
            <span className="reel__line"><span>A Software Studio,</span></span>{' '}
            <span className="reel__line"><span>Wired into What&rsquo;s Next</span></span>
          </h1>
          <p className="reel__lede">We design and build digital products, intelligent systems and experiences for the web.</p>
          <div className="reel__actions">
            <a className="button-cream" href="#start">Start a project <ArrowRight size={15} /></a>
            <a className="reel__ghost" href="#work">See the work</a>
          </div>
        </div>

        <span className="reel__exit" aria-hidden="true" />
        <div className="reel__hud" aria-hidden="true">
          <span className="reel__hint"><ArrowDown size={14} /> {mode === 'scrub' ? 'Scroll to roll' : 'Scroll to explore'}</span>
          <span className="reel__time" ref={timeRef}>REEL 01</span>
          <span className="reel__bar"><i /></span>
        </div>
      </div>
    </section>
  )
}

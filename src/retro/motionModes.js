// Breakpoint contexts shared by the scroll chapters (used with gsap.matchMedia).
const MOTION = '(prefers-reduced-motion: no-preference)'

// Pinned desktop scenes need real height as well as width: a 932×430 landscape phone is
// "wide" but has no room for a pinned chapter.
export const DESKTOP_MOTION = `(min-width: 900px) and (min-height: 560px) and ${MOTION}`

// Phone modes key off orientation, not viewport height: the address bar changes the height
// while scrolling, and a height query flipping mid-scroll would rebuild a pin under a finger.
export const MOBILE_PORTRAIT = `(max-width: 899px) and (orientation: portrait) and ${MOTION}`
// Any short landscape screen (phones held sideways at any width), plus narrow landscape tablets.
export const MOBILE_LANDSCAPE = `(max-width: 899px) and (orientation: landscape) and ${MOTION}, (orientation: landscape) and (max-height: 559px) and ${MOTION}`

// The pace of the pinned scenes, shared so the page reads as one flow. Scroll distances stretch
// by scenePace() (most on phones, where one flick travels furthest), the timelines catch up to
// the scroll over SCENE_SCRUB seconds, and SCENE_SNAP settles them gently on a stop.
export const scenePace = () => (window.matchMedia('(max-width: 899px)').matches ? 1.7 : 1.25)
export const SCENE_SCRUB = 1.2
export const SCENE_SNAP = { inertia: false, duration: { min: 0.5, max: 1.2 }, delay: 0.3, ease: 'power1.inOut' }

// Screen height is stable while scrolling; below this a pinned scene would not fit.
export const roomForPinnedScene = () => Math.max(window.screen.height, window.innerHeight) >= 700


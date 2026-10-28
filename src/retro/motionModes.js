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

// Screen height is stable while scrolling; below this a pinned scene would not fit.
export const roomForPinnedScene = () => Math.max(window.screen.height, window.innerHeight) >= 700

// How We Work pins a terminal next to the stage list; it only fits from this height up.
export const PROCESS_PINNED = `(min-width: 900px) and (min-height: 720px) and ${MOTION}`
// Everything else animates in normal flow (it is also the no-JS / reduced-motion layout).
export const PROCESS_FLOW = `(max-width: 899px) and ${MOTION}, (max-height: 719px) and ${MOTION}`

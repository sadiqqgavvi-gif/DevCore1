import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Mobile browser chrome (URL bar) resizes the viewport while scrolling. Refreshing every
// pinned trigger on each of those resizes causes jumps, so ignore them; real orientation
// and window resizes still refresh.
ScrollTrigger.config({ ignoreMobileResize: true })

// One debounced refresh entry point so layout-affecting events (fonts, mount) don't each
// trigger their own full ScrollTrigger refresh.
let refreshTimer = 0
export function requestScrollRefresh(delay = 120) {
  window.clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), delay)
}

export { gsap, ScrollTrigger, useGSAP }

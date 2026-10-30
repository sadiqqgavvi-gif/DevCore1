import { ScrollTrigger } from '../lib/gsap.js'

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const ease = (t) => t * t * (3 - 2 * t)

// Element's top in the document, from layout offsets (unaffected by the transforms we write).
function documentTop(element) {
  let top = 0
  for (let node = element; node; node = node.offsetParent) top += node.offsetTop
  return top
}

// Scroll-linked entrance and exit for a vertical list of cards. One ScrollTrigger covers the
// whole list; each card's motion is computed from the scroll position and geometry measured on
// refresh, so scrolling does no layout reads and the motion reverses exactly on the way back.
// `apply(index, enter, exit)` writes the styles: enter runs 0 → 1 as the card's top rises from
// the bottom of the screen to its middle, exit runs 0 → 1 as its bottom leaves the upper part.
// Create it inside a gsap context (the trigger is reverted with it); the caller clears its styles.
export function scrollDepth(cards, apply, { exitFrom = 0.4, exitTo = 0.1 } = {}) {
  let boxes = []
  let viewport = window.innerHeight
  const measure = () => {
    viewport = window.innerHeight
    boxes = cards.map((card) => ({ top: documentTop(card), height: card.offsetHeight }))
  }
  const render = (scroll) => {
    boxes.forEach(({ top, height }, index) => {
      const y = top - scroll
      const enter = ease(clamp01((viewport - y) / (viewport * 0.5)))
      const exit = ease(clamp01((viewport * exitFrom - (y + height)) / (viewport * (exitFrom - exitTo))))
      apply(index, enter, exit)
    })
  }
  ScrollTrigger.create({
    trigger: cards[0].parentElement,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => render(self.scroll()),
    onRefresh: (self) => { measure(); render(self.scroll()) },
  })
  measure()
  render(window.scrollY)
}

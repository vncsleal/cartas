import { onFrame, onCleanup, reduced } from "./core"

/**
 * Scroll reveal system + parallax covers.
 * [data-reveal] elements fade/rise in when entering the viewport,
 * staggered per parent group via --rd.
 * [data-parallax] imgs drift against scroll for cinematic depth.
 */

export function initReveals(settleMs = 0): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
  if (els.length === 0) return

  if (reduced()) {
    els.forEach((el) => el.classList.add("is-revealed"))
    return
  }

  // Stagger siblings that share a parent
  const groups = new Map<Element, number>()
  for (const el of els) {
    const parent = el.parentElement ?? document.body
    const idx = groups.get(parent) ?? 0
    el.style.setProperty("--rd", `${Math.min(idx * 70, 420)}ms`)
    groups.set(parent, idx + 1)
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed")
          io.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  )

  // Delay observing until the view transition settles, so revealed state
  // in the live DOM matches the captured snapshot at pseudo-tree removal.
  const timer = window.setTimeout(() => {
    els.forEach((el) => io.observe(el))
  }, settleMs)

  onCleanup(() => {
    window.clearTimeout(timer)
    io.disconnect()
  })
}

export function initParallax(): void {
  if (reduced()) return

  const frames = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"))
    .map((frame) => ({ frame, img: frame.querySelector<HTMLElement>("img") }))
    .filter((x): x is { frame: HTMLElement; img: HTMLElement } => Boolean(x.img))

  if (frames.length === 0) return

  const strength = 0.075

  const update = () => {
    const vh = window.innerHeight
    for (const { frame, img } of frames) {
      const rect = frame.getBoundingClientRect()
      if (rect.bottom < -80 || rect.top > vh + 80) continue
      const centerDelta = rect.top + rect.height / 2 - vh / 2
      const shift = -centerDelta * strength
      img.style.transform = `scale(1.16) translate3d(0, ${shift.toFixed(2)}px, 0)`
    }
  }

  // Apply synchronously so the view-transition snapshot of the new page
  // already matches the live DOM state (no transform pop at removal).
  update()
  onFrame(update)
}

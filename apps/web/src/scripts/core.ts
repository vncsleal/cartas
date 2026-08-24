import Lenis from "lenis"

/**
 * Core client runtime.
 * - One Lenis instance for cinematic scrolling (persisted across view transitions)
 * - One rAF frame loop that page features subscribe to
 * - Shared pointer state
 * - Per-page lifecycle: cleanup on astro:before-swap, re-init on astro:page-load
 */

type FrameFn = (t: number) => void

const updaters = new Set<FrameFn>()
let cleanups: (() => void)[] = []
let lenis: Lenis | null = null
let booted = false
let pendingSwap = false

export const pointer = { x: -1000, y: -1000 }

/**
 * Milliseconds to wait before running entrance animations so the live DOM
 * matches the captured view-transition snapshot when the pseudo tree is
 * removed (prevents end-of-transition pops). ~0 on first load.
 */
export function takeSettleMs(): number {
  const ms = pendingSwap ? 640 : 60
  pendingSwap = false
  return ms
}

export function reduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function finePointer(): boolean {
  return window.matchMedia("(pointer: fine)").matches
}

export function onFrame(fn: FrameFn): void {
  updaters.add(fn)
}

export function onCleanup(fn: () => void): void {
  cleanups.push(fn)
}

export function getLenis(): Lenis | null {
  return lenis
}

export function scrollLock(lock: boolean): void {
  if (lenis) {
    lock ? lenis.stop() : lenis.start()
  }
  document.documentElement.style.overflow = lock ? "hidden" : ""
}

function frame(t: number): void {
  for (const fn of updaters) fn(t)
  requestAnimationFrame(frame)
}

export function boot(): void {
  if (booted) return
  booted = true

  if (!reduced()) {
    lenis = new Lenis({
      autoRaf: true,
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
    },
    { passive: true }
  )

  requestAnimationFrame(frame)

  document.addEventListener("astro:before-swap", () => {
    pendingSwap = true
    updaters.clear()
    for (const fn of cleanups) fn()
    cleanups = []
  })

  document.addEventListener("astro:after-swap", () => {
    lenis?.resize()
    // Sync Lenis's internal scroll state with wherever the router put us
    // (top for new pages, restored position on back/forward) so it can't
    // animate the scroll back mid-transition.
    lenis?.scrollTo(window.scrollY, { immediate: true, force: true })
  })
}

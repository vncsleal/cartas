import { onFrame, onCleanup, reduced, finePointer, pointer } from "./core"

/**
 * Kinetic type: masked staggered entrance, then letters gain
 * variable-font weight near the pointer.
 */

export function initKinetic(settleMs = 0): void {
  const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-kinetic]"))
  if (roots.length === 0) return

  // Masked entrance — held until the view transition settles so the live
  // DOM matches the captured snapshot when the pseudo tree is removed.
  const enterTimer = window.setTimeout(() => {
    roots.forEach((root) => root.classList.add("is-in"))
  }, settleMs)
  onCleanup(() => window.clearTimeout(enterTimer))

  if (reduced() || !finePointer()) return

  // Pointer-reactive variable font weight, after the entrance settles.
  // Each char modulates from its CSS-defined base weight/width up to 900,
  // so moving the cursor away never changes the designed typography.
  const charData: { ch: HTMLElement; baseWght: number; baseWdth: number }[] = []

  roots.forEach((root) => {
    const fs = getComputedStyle(root).fontVariationSettings
    const wghtMatch = fs.match(/"wght"\s+([\d.]+)/)
    const wdthMatch = fs.match(/"wdth"\s+([\d.]+)/)
    const baseWght = wghtMatch ? parseFloat(wghtMatch[1]) : 800
    const baseWdth = wdthMatch ? parseFloat(wdthMatch[1]) : 125
    root.querySelectorAll<HTMLElement>(".kn-char").forEach((ch) => {
      charData.push({ ch, baseWght, baseWdth })
    })
  })

  if (charData.length === 0) return

  let active = false
  const activeTimer = window.setTimeout(() => {
    active = true
  }, settleMs + 1050 + charData.length * 45)
  onCleanup(() => window.clearTimeout(activeTimer))

  const radius = 260

  onFrame(() => {
    if (!active) return
    for (const { ch, baseWght, baseWdth } of charData) {
      const rect = ch.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = pointer.x - cx
      const dy = pointer.y - cy
      const dist = Math.hypot(dx, dy)
      const f = Math.max(0, 1 - dist / radius)
      const eased = f * f * (3 - 2 * f) // smoothstep
      const wght = Math.round(baseWght + eased * (900 - baseWght))
      const lift = (-eased * 0.04).toFixed(3)
      ch.style.fontVariationSettings = `"wght" ${wght}, "wdth" ${baseWdth}`
      ch.style.transform = eased > 0.01 ? `translateY(${lift}em)` : ""
    }
  })
}

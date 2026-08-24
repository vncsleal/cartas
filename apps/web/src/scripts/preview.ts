import { onFrame, onCleanup, reduced, finePointer, pointer } from "./core"

/**
 * Cursor-following cover preview for story rows.
 * The outer element is positioned with lerped motion;
 * the inner handles show/hide scale via CSS.
 */

export function initPreview(): void {
  if (reduced() || !finePointer()) return

  const preview = document.querySelector<HTMLElement>("[data-cursor-preview]")
  const img = preview?.querySelector<HTMLImageElement>("[data-cp-img]")
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-preview]"))
  if (!preview || !img || targets.length === 0) return

  let x = pointer.x
  let y = pointer.y
  let visible = false
  let lastX = x

  const show = (src: string) => {
    if (img.dataset.src !== src) {
      img.src = src
      img.dataset.src = src
    }
    preview.classList.add("is-on")
    visible = true
  }

  const hide = () => {
    preview.classList.remove("is-on")
    visible = false
  }

  const onOver = (e: Event) => {
    const el = (e.currentTarget as HTMLElement)
    const src = el.dataset.preview
    if (src) show(src)
  }
  const onOut = () => hide()

  targets.forEach((el) => {
    el.addEventListener("mouseenter", onOver)
    el.addEventListener("mouseleave", onOut)
  })

  onCleanup(() => {
    targets.forEach((el) => {
      el.removeEventListener("mouseenter", onOver)
      el.removeEventListener("mouseleave", onOut)
    })
  })

  onFrame(() => {
    const ease = 0.14
    x += (pointer.x - x) * ease
    y += (pointer.y - y) * ease
    const velocity = x - lastX
    lastX = x
    const tilt = Math.max(-7, Math.min(7, velocity * 0.35))
    const offsetX = 28
    const offsetY = -preview.offsetHeight / 2
    preview.style.transform = `translate3d(${(x + offsetX).toFixed(1)}px, ${(y + offsetY).toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`
    if (!visible) return
  })
}

/**
 * Warm the article-hero rendition (w=1600) on hover intent, so the
 * view-transition morph target is already cached and decoded at click
 * time — otherwise the snapshot captures an empty frame and the bitmap
 * pops in when the transition ends.
 */
export function initHeroWarm(): void {
  if (!finePointer()) return

  const onOver = (e: Event) => {
    const el = (e.target as HTMLElement).closest?.("[data-hero]") as HTMLElement | null
    if (!el || el.dataset.warmed) return
    el.dataset.warmed = "1"
    const src = el.dataset.hero
    if (src) {
      const pre = new Image()
      pre.src = src
    }
  }

  document.addEventListener("mouseover", onOver, { passive: true })
  onCleanup(() => document.removeEventListener("mouseover", onOver))
}

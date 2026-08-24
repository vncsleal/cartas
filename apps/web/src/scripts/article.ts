import { onFrame, onCleanup, scrollLock } from "./core"

/**
 * Article page interactions: reading progress + image lightbox.
 */

export function initProgress(): void {
  const fill = document.querySelector<HTMLElement>("[data-progress-fill]")
  const pct = document.querySelector<HTMLElement>("[data-letter-pct]")
  const segs = document.querySelector<HTMLElement>("[data-letter-progress]")
  if (!fill && !pct) return

  let last = -1

  onFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const f = max > 0 ? Math.min(window.scrollY / max, 1) : 0
    if (fill) fill.style.transform = `scaleX(${f.toFixed(4)})`

    const p = Math.round(f * 100)
    if (p === last) return
    last = p

    if (pct) pct.textContent = `${p}%`
    if (segs) {
      const on = Math.round(f * 10)
      segs.querySelectorAll("i").forEach((seg, i) => {
        seg.classList.toggle("is-on", i < on)
      })
    }
  })
}

export function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-lightbox-dialog]")
  const dialogImg = dialog?.querySelector<HTMLImageElement>("[data-lightbox-img]")
  const figures = Array.from(document.querySelectorAll<HTMLImageElement>("[data-lightbox]"))
  if (!dialog || !dialogImg || figures.length === 0) return

  const open = (img: HTMLImageElement) => {
    const src = img.currentSrc || img.src
    if (!src) return
    // Request a larger rendition from the CDN, capped at the source width
    const full = Math.min(Number(img.dataset.fullWidth) || 2400, 2400)
    dialogImg.src = src.replace(/w=\d+/, `w=${full}`)
    dialog.showModal()
    requestAnimationFrame(() => dialog.classList.add("is-open"))
    scrollLock(true)
  }

  const close = () => {
    dialog.classList.remove("is-open")
    scrollLock(false)
    window.setTimeout(() => dialog.close(), 220)
  }

  const onFigureClick = (e: Event) => open(e.currentTarget as HTMLImageElement)
  const onDialogClick = () => close()
  const onCancel = (e: Event) => {
    e.preventDefault()
    close()
  }

  figures.forEach((img) => img.addEventListener("click", onFigureClick))
  dialog.addEventListener("click", onDialogClick)
  dialog.addEventListener("cancel", onCancel)

  onCleanup(() => {
    figures.forEach((img) => img.removeEventListener("click", onFigureClick))
    dialog.removeEventListener("click", onDialogClick)
    dialog.removeEventListener("cancel", onCancel)
    if (dialog.open) dialog.close()
    scrollLock(false)
  })
}

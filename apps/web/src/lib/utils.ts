export interface CoverMeta {
  cover?: string
  coverWidth?: number
  coverHeight?: number
  coverCrop?: { left: number; top: number; right: number; bottom: number }
  coverHotspot?: { x: number; y: number; width: number; height: number }
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Editor crop (fractions of the source) → Sanity `rect` param (source pixels). */
const coverRect = (cover: CoverMeta | undefined): string | null => {
  const crop = cover?.coverCrop
  const w = cover?.coverWidth
  const h = cover?.coverHeight
  if (!crop || !w || !h) return null
  const left = clamp01(crop.left)
  const top = clamp01(crop.top)
  const right = clamp01(crop.right)
  const bottom = clamp01(crop.bottom)
  const cw = Math.round(w * (1 - left - right))
  const ch = Math.round(h * (1 - top - bottom))
  if (cw >= w && ch >= h) return null
  return `rect=${Math.round(left * w)},${Math.round(top * h)},${Math.max(1, cw)},${Math.max(1, ch)}`
}

export const img = (url: string, w: number, cover?: CoverMeta) => {
  const rect = coverRect(cover)
  return `${url}?w=${w}&auto=format&q=85${rect ? `&${rect}` : ""}`
}

export const srcset = (url: string, widths: number[], cover?: CoverMeta) =>
  widths.map((w) => `${img(url, w, cover)} ${w}w`).join(", ")

/** srcset capped at the asset's intrinsic width — the CDN upscales otherwise. */
export const cappedSrcset = (url: string, widths: number[], intrinsic?: number): string | undefined => {
  const cap = intrinsic ?? Infinity
  const available = widths.filter((w) => w <= cap)
  if (available.length === 0) return undefined
  return srcset(url, available)
}

/** srcset capped at the asset's intrinsic width — the CDN upscales otherwise. */
export const coverSrcset = (cover: CoverMeta | undefined, widths: number[]): string | undefined => {
  if (!cover?.cover) return undefined
  const cap = cover.coverWidth ?? Infinity
  const available = widths.filter((w) => w <= cap)
  if (available.length === 0) return undefined
  return srcset(cover.cover, available, cover)
}

/** Intrinsic (post-crop) pixel size for width/height attributes → no CLS. */
export const coverSize = (cover: CoverMeta | undefined): { width?: number; height?: number } => {
  const w = cover?.coverWidth
  const h = cover?.coverHeight
  if (!w || !h) return {}
  const crop = cover?.coverCrop
  if (crop && (crop.left || crop.top || crop.right || crop.bottom)) {
    return {
      width: Math.max(1, Math.round(w * (1 - clamp01(crop.left) - clamp01(crop.right)))),
      height: Math.max(1, Math.round(h * (1 - clamp01(crop.top) - clamp01(crop.bottom)))),
    }
  }
  return { width: w, height: h }
}

/** Hotspot → object-position so the browser's object-fit crop honors the focal point. */
export const coverStyle = (cover: CoverMeta | undefined): string | undefined => {
  const hotspot = cover?.coverHotspot
  if (!hotspot) return undefined
  const crop = cover?.coverCrop ?? { left: 0, top: 0, right: 0, bottom: 0 }
  const dx = 1 - clamp01(crop.left) - clamp01(crop.right)
  const dy = 1 - clamp01(crop.top) - clamp01(crop.bottom)
  const fx = dx > 0 ? clamp01((clamp01(hotspot.x) - clamp01(crop.left)) / dx) : 0.5
  const fy = dy > 0 ? clamp01((clamp01(hotspot.y) - clamp01(crop.top)) / dy) : 0.5
  return `object-position: ${(fx * 100).toFixed(1)}% ${(fy * 100).toFixed(1)}%`
}

/** Largest rendition (capped at 3200) — warms the view-transition morph target. */
export const heroCover = (cover: CoverMeta | undefined): string | undefined =>
  cover?.cover
    ? img(cover.cover, Math.min(cover.coverWidth ?? 3200, 3200), cover)
    : undefined

/** Social share image (1200x630) honoring the editor crop + hotspot, without
    upscaling past the source. Absolute CDN URL, ready for og:image. */
export const ogImage = (cover: CoverMeta | undefined): string | undefined => {
  if (!cover?.cover) return undefined
  const w = cover.coverWidth ?? 0
  const h = cover.coverHeight ?? 0
  if (!w || !h) return undefined

  const crop = cover.coverCrop ?? { left: 0, top: 0, right: 0, bottom: 0 }
  const rect = {
    x: clamp01(crop.left) * w,
    y: clamp01(crop.top) * h,
    w: w * (1 - clamp01(crop.left) - clamp01(crop.right)),
    h: h * (1 - clamp01(crop.top) - clamp01(crop.bottom)),
  }

  // Fit the target aspect inside the editor crop, centered on the hotspot.
  const TARGET = 1200 / 630
  if (rect.w / rect.h > TARGET) {
    const nw = rect.h * TARGET
    const fx = cover.coverHotspot
      ? clamp01((clamp01(cover.coverHotspot.x) - clamp01(crop.left)) / (1 - clamp01(crop.left) - clamp01(crop.right)))
      : 0.5
    rect.x = rect.x + fx * (rect.w - nw)
    rect.w = nw
  } else {
    const nh = rect.w / TARGET
    const fy = cover.coverHotspot
      ? clamp01((clamp01(cover.coverHotspot.y) - clamp01(crop.top)) / (1 - clamp01(crop.top) - clamp01(crop.bottom)))
      : 0.5
    rect.y = rect.y + fy * (rect.h - nh)
    rect.h = nh
  }

  const scale = Math.min(1, 1200 / rect.w)
  const wOut = Math.max(1, Math.round(rect.w * scale))
  const hOut = Math.max(1, Math.round(rect.h * scale))
  const p = Math.round
  return `${cover.cover}?rect=${p(rect.x)},${p(rect.y)},${p(rect.w)},${p(rect.h)}&w=${wOut}&h=${hOut}&fit=crop&auto=format&q=80`
}

export const absolute = (path: string): string => new URL(path, import.meta.env.SITE).href

/** Date-only strings ("2026-06-25") parse as UTC midnight — which is the
    previous day in negative timezones. Anchor at local noon instead. */
const parseDate = (date: string) =>
  new Date(date.includes("T") ? date : `${date}T12:00:00`)

export const formatDate = (date: string) =>
  parseDate(date).toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

export const formatDateLong = (date: string) =>
  parseDate(date).toLocaleDateString("pt-BR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

interface TextBlock {
  _type?: string
  children?: { text?: string }[]
}

export function readingTime(blocks: TextBlock[]): number {
  const words = blocks
    .filter((b) => b._type !== "image")
    .flatMap((b) => b.children ?? [])
    .map((c) => c.text ?? "")
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

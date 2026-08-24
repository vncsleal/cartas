import { boot, takeSettleMs } from "./core"
import { initReveals, initParallax } from "./reveal"
import { initKinetic } from "./kinetic"
import { initPreview, initHeroWarm } from "./preview"
import { initPalette } from "./palette"
import { initProgress, initLightbox } from "./article"
import { initTopBar } from "./topbar"

boot()

document.addEventListener("astro:page-load", () => {
  const settle = takeSettleMs()
  initTopBar()
  initReveals(settle)
  initParallax()
  initKinetic(settle)
  initPreview()
  initHeroWarm()
  initPalette()
  initProgress()
  initLightbox()
})

import { onFrame, onCleanup } from "./core"

/**
 * TopBar: hairline when scrolled, hides on scroll down, returns on scroll up.
 * The wordmark yields to the huge kinetic page title — hidden while the
 * title is on screen, sliding back once it's scrolled past.
 */

export function initTopBar(): void {
  const bar = document.querySelector<HTMLElement>("[data-topbar]")
  if (!bar) return

  const todayEls = document.querySelectorAll<HTMLTimeElement>("[data-today]")
  if (todayEls.length > 0) {
    const d = new Date()
    const label = d.toLocaleDateString("pt-BR", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    todayEls.forEach((el) => {
      el.textContent = label
      el.dateTime = d.toISOString()
    })
  }

  // Theme toggle — eclipse wipe: to dark, the light collapses into the
  // toggle; to light, dawn radiates outward from it.
  const themeBtn = bar.querySelector<HTMLButtonElement>("[data-theme-toggle]")
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const rootEl = document.documentElement
      const next = rootEl.dataset.theme === "dark" ? "light" : "dark"

      const apply = () => {
        rootEl.dataset.theme = next
        localStorage.setItem("theme", next)
      }

      if (
        !document.startViewTransition ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        apply()
        return
      }

      const { top, left, width, height } = themeBtn.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )

      rootEl.dataset.themeTransition = next === "dark" ? "to-dark" : "to-light"

      const transition = document.startViewTransition(apply)

      transition.ready.then(() => {
        const wipe = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ]
        const full = [`circle(${maxRadius * 2}px at ${x}px ${y}px)`]
        const opts = {
          duration: 650,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }

        if (next === "light") {
          // dawn: light radiates outward on top of the held dark frame
          rootEl.animate(
            { clipPath: wipe },
            { ...opts, pseudoElement: "::view-transition-new(root)" },
          )
          rootEl.animate(
            { clipPath: full },
            { ...opts, pseudoElement: "::view-transition-old(root)" },
          )
        } else {
          // eclipse: the light frame shrinks into the toggle, dark beneath
          rootEl.animate(
            { clipPath: [...wipe].reverse() },
            { ...opts, pseudoElement: "::view-transition-old(root)" },
          )
          rootEl.animate(
            { clipPath: full },
            { ...opts, pseudoElement: "::view-transition-new(root)" },
          )
        }
      })

      const cleanup = () => delete rootEl.dataset.themeTransition
      transition.finished.then(cleanup, cleanup)
    })
  }

  // LCD clock — ticks every 30s
  const lcdTimeEls = document.querySelectorAll<HTMLElement>("[data-lcd-time]")
  if (lcdTimeEls.length > 0) {
    const tick = () => {
      const label = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
      lcdTimeEls.forEach((el) => {
        el.textContent = label
      })
    }
    tick()
    const iv = window.setInterval(tick, 30_000)
    onCleanup(() => window.clearInterval(iv))
  }

  const wordmark = bar.querySelector<HTMLElement>("[data-wordmark]")
  // Only the home hero is the brand rendered huge — yield to it there.
  // Everywhere else (articles, 404) the wordmark stays as the way home.
  const brandTitle = document.querySelector<HTMLElement>("[data-brand-title]")

  if (wordmark && brandTitle) {
    wordmark.classList.add("is-off")
    const io = new IntersectionObserver(
      ([entry]) => {
        wordmark.classList.toggle("is-off", entry.isIntersecting)
      },
      { rootMargin: "-56px 0px 0px 0px" }
    )
    io.observe(brandTitle)
    onCleanup(() => io.disconnect())
  }

  let lastY = window.scrollY

  onFrame(() => {
    const y = window.scrollY
    bar.classList.toggle("is-scrolled", y > 8)

    const goingDown = y > lastY + 4
    const goingUp = y < lastY - 4

    if (goingDown && y > 140) {
      bar.classList.add("is-hidden")
    } else if (goingUp || y <= 140) {
      bar.classList.remove("is-hidden")
    }

    if (goingDown || goingUp) lastY = y
  })
}

import { navigate } from "astro:transitions/client"
import { onCleanup, scrollLock } from "./core"

/**
 * ⌘K command palette: fuzzy search across posts, topics and pages.
 * Data comes from the [data-search-index] JSON island rendered by Base.
 */

interface IndexPost {
  s: string
  t: string
  d: string
  x: string
  g: string[]
}

interface IndexTopic {
  s: string
  t: string
}

interface SearchIndex {
  posts: IndexPost[]
  topics: IndexTopic[]
}

interface Result {
  group: string
  title: string
  meta: string
  href: string
}

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (q.length === 0) return 1
  let score = 0
  let qi = 0
  let streak = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak++
      score += 1 + streak * 2
      qi++
    } else {
      streak = 0
    }
  }
  return qi === q.length ? score : 0
}

function readIndex(): SearchIndex {
  const el = document.querySelector("[data-search-index]")
  if (!el?.textContent) return { posts: [], topics: [] }
  try {
    return JSON.parse(el.textContent) as SearchIndex
  } catch {
    return { posts: [], topics: [] }
  }
}

export function initPalette(): void {
  const root = document.querySelector<HTMLElement>("[data-palette]")!
  const input = root?.querySelector<HTMLInputElement>("[data-palette-input]")!
  const list = root?.querySelector<HTMLElement>("[data-palette-list]")!
  if (!root || !input || !list) return

  const index = readIndex()
  let open = false
  let selected = 0
  let results: Result[] = []
  let lastFocus: HTMLElement | null = null

  const formatMeta = (iso: string) => {
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`)
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
  }

  function buildResults(query: string): Result[] {
    const q = query.trim()
    if (q.length === 0) {
      return [
        ...index.posts.slice(0, 5).map((p) => ({
          group: "Últimas cartas",
          title: p.t,
          meta: formatMeta(p.d),
          href: `/${p.s}`,
        })),
        ...index.topics.map((t) => ({
          group: "Temas",
          title: t.t,
          meta: "Tema",
          href: `/topic/${t.s}`,
        })),
        { group: "Páginas", title: "Todas as cartas", meta: "Início", href: "/" },
        { group: "Páginas", title: "Sobre o autor", meta: "Autor", href: "/autor" },
        { group: "Páginas", title: "Feed RSS", meta: "Assinar", href: "/rss.xml" },
      ]
    }

    const posts = index.posts
      .map((p) => {
        const score =
          fuzzyScore(q, p.t) * 3 +
          fuzzyScore(q, p.x) +
          fuzzyScore(q, p.g.join(" ")) * 1.5
        return { score, result: { group: "Cartas", title: p.t, meta: formatMeta(p.d), href: `/${p.s}` } }
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map((r) => r.result)

    const topics = index.topics
      .filter((t) => fuzzyScore(q, t.t) > 0)
      .map((t) => ({ group: "Temas", title: t.t, meta: "Tema", href: `/topic/${t.s}` }))

    return [...posts, ...topics]
  }

  function render(): void {
    if (results.length === 0) {
      list.innerHTML = `<li class="palette-empty">Sem sinal — nada encontrado</li>`
      return
    }

    let html = ""
    let lastGroup = ""
    results.forEach((r, i) => {
      if (r.group !== lastGroup) {
        html += `<li class="palette-group" aria-hidden="true">${r.group}</li>`
        lastGroup = r.group
      }
      html += `<li class="palette-item${i === selected ? " is-active" : ""}" role="option" aria-selected="${i === selected}" data-idx="${i}">
        <span class="pi-title">${r.title}</span>
        <span class="pi-meta">${r.meta}</span>
      </li>`
    })
    list.innerHTML = html

    list.querySelectorAll<HTMLElement>(".palette-item").forEach((item) => {
      item.addEventListener("click", () => {
        const idx = Number(item.dataset.idx)
        go(results[idx])
      })
      item.addEventListener("mousemove", () => {
        const idx = Number(item.dataset.idx)
        if (idx !== selected) {
          selected = idx
          paintActive()
        }
      })
    })
  }

  function paintActive(): void {
    list.querySelectorAll<HTMLElement>(".palette-item").forEach((item) => {
      const idx = Number(item.dataset.idx)
      item.classList.toggle("is-active", idx === selected)
      item.setAttribute("aria-selected", String(idx === selected))
    })
    list.querySelector(".palette-item.is-active")?.scrollIntoView({ block: "nearest" })
  }

  function go(result: Result | undefined): void {
    if (!result) return
    close()
    if (result.href === "/rss.xml") {
      window.location.href = result.href
    } else {
      navigate(result.href)
    }
  }

  function openPalette(): void {
    if (open) return
    open = true
    lastFocus = document.activeElement as HTMLElement | null
    root.hidden = false
    requestAnimationFrame(() => root.classList.add("is-open"))
    scrollLock(true)
    selected = 0
    input.value = ""
    results = buildResults("")
    render()
    input.focus()
  }

  function close(): void {
    if (!open) return
    open = false
    root.classList.remove("is-open")
    scrollLock(false)
    window.setTimeout(() => {
      root.hidden = true
    }, 260)
    lastFocus?.focus()
  }

  function onKeydown(e: KeyboardEvent): void {
    const typing = /^(INPUT|TEXTAREA)$/.test((e.target as HTMLElement)?.tagName ?? "")

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      open ? close() : openPalette()
      return
    }

    if (!open && e.key === "/" && !typing) {
      e.preventDefault()
      openPalette()
      return
    }

    if (!open) return

    if (e.key === "Escape") {
      e.preventDefault()
      close()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      selected = Math.min(selected + 1, results.length - 1)
      paintActive()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      selected = Math.max(selected - 1, 0)
      paintActive()
    } else if (e.key === "Enter") {
      e.preventDefault()
      go(results[selected])
    }
  }

  function onInput(): void {
    selected = 0
    results = buildResults(input.value)
    render()
  }

  const openButtons = Array.from(document.querySelectorAll<HTMLElement>("[data-palette-open]"))
  const veil = root.querySelector<HTMLElement>("[data-palette-close]")

  document.addEventListener("keydown", onKeydown)
  input.addEventListener("input", onInput)
  openButtons.forEach((btn) => btn.addEventListener("click", openPalette))
  veil?.addEventListener("click", close)

  onCleanup(() => {
    document.removeEventListener("keydown", onKeydown)
    input.removeEventListener("input", onInput)
    openButtons.forEach((btn) => btn.removeEventListener("click", openPalette))
    veil?.removeEventListener("click", close)
    scrollLock(false)
  })
}

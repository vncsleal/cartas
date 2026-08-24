import { escapeHtml } from "./utils"

interface Span {
  _key?: string
  _type?: string
  text?: string
  marks?: string[]
}

interface MarkDef {
  _key: string
  _type: string
  href?: string
}

const DECORATORS: Record<string, [string, string]> = {
  strong: ["<strong>", "</strong>"],
  em: ["<em>", "</em>"],
  code: ["<code>", "</code>"],
  underline: ["<u>", "</u>"],
  "strike-through": ["<s>", "</s>"],
}

/** Render portable-text children spans to an HTML string (links, bold, code…). */
export function renderChildren(children: Span[] = [], markDefs: MarkDef[] = []): string {
  return children
    .map((span) => {
      let html = escapeHtml(span.text ?? "")
      const marks = span.marks ?? []

      for (const mark of marks) {
        const deco = DECORATORS[mark]
        if (deco) html = `${deco[0]}${html}${deco[1]}`
      }

      // Annotation marks (links) wrap outermost
      for (const mark of marks) {
        const def = markDefs.find((d) => d._key === mark)
        if (def?._type === "link" && def.href) {
          const href = escapeHtml(def.href)
          const external = /^https?:\/\//.test(def.href)
          const attrs = external ? ` target="_blank" rel="noopener noreferrer"` : ""
          html = `<a href="${href}"${attrs}>${html}</a>`
        }
      }

      return html
    })
    .join("")
}

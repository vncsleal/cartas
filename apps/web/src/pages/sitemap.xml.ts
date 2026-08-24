import type { APIRoute } from "astro"
import { store } from "../adapters/sanity"

interface Entry {
  path: string
  priority: string
  lastmod?: string
}

export const GET: APIRoute = async ({ site }) => {
  const [posts, topics] = await Promise.all([store.getPosts(), store.getTopics()])
  const base = typeof site === "string" ? new URL(site) : site!

  const usedSlugs = new Set(posts.flatMap((p) => p.topics ?? []))

  const entries: Entry[] = [
    { path: "/", priority: "1.0", lastmod: posts[0]?.date },
    { path: "/autor", priority: "0.6" },
    ...topics
      .filter((t) => usedSlugs.has(t.slug))
      .map((t) => ({ path: `/topic/${t.slug}`, priority: "0.5" })),
    ...posts.map((p) => ({ path: `/${p.slug}`, priority: "0.6", lastmod: p.date })),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${entries
    .map(
      (u) => `
  <url>
    <loc>${escapeXml(new URL(u.path, base).href)}</loc>
    ${u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : ""}
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("")}
</urlset>`

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  })
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

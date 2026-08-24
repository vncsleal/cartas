import type { APIRoute } from "astro"
import { store } from "../adapters/sanity"
import { compileRssFeed } from "@cartas/artifacts"

export const GET: APIRoute = async ({ site }) => {
  const [posts, blog] = await Promise.all([store.getPosts(), store.getBlog()])
  const feed = compileRssFeed(posts)
  const base = typeof site === "string" ? site : site!.href.replace(/\/$/, "")

  const feedTitle = blog?.pageTitle ?? "Cartas para um Astronauta"
  const feedDescription = blog?.seoDescription ?? `${feedTitle} RSS feed`

  const items = feed.items
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${base}/${item.slug}</link>
      <description>${escapeXml(item.description ?? "")}</description>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <author>${escapeXml(item.author)}</author>
    </item>`
    )
    .join("")

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${base}</link>
    <description>${escapeXml(feedDescription)}</description>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  })
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

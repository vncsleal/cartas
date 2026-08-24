import type { Post } from "@cartas/domain"

export interface RssFeedItem {
  title: string
  slug: string
  description: string | null
  date: string
  author: string
}

export interface RssFeed {
  items: RssFeedItem[]
}

export function compileRssFeed(posts: Post[]): RssFeed {
  return {
    items: posts.map((p) => ({
      title: p.title,
      slug: p.slug,
      description: p.description ?? null,
      date: p.date,
      author: p.author,
    })),
  }
}

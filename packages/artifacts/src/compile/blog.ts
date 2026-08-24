import type { Post, Blog } from "@cartas/domain"

export interface CompiledBlog {
  pageTitle: string
  seoTitle: string | null
  seoDescription: string | null
  tagline: string | null
  emptyState: string | null
  posts: Post[]
}

export function compileBlog(posts: Post[], blog: Blog | null): CompiledBlog {
  return {
    pageTitle: blog?.pageTitle ?? "VNCS.",
    seoTitle: blog?.seoTitle ?? null,
    seoDescription: blog?.seoDescription ?? null,
    tagline: blog?.tagline ?? null,
    emptyState: blog?.emptyState ?? null,
    posts,
  }
}

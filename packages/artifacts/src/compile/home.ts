import type { Author, Home } from "@cartas/domain"

export interface CompiledHome {
  pageTitle: string
  seoTitle: string | null
  seoDescription: string | null
  tagline: string | null
  author: Author | null
}

export function compileHome(author: Author | null, home: Home | null): CompiledHome {
  return {
    pageTitle: home?.pageTitle ?? "VNCS.",
    seoTitle: home?.seoTitle ?? null,
    seoDescription: home?.seoDescription ?? null,
    tagline: home?.tagline ?? null,
    author,
  }
}

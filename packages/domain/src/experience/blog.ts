import { z } from "zod"

export const Blog = z.object({
  pageTitle: z.string(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  tagline: z.string().optional(),
  emptyState: z.string().optional(),
})

export type Blog = z.infer<typeof Blog>

import { z } from "zod"

export const Home = z.object({
  pageTitle: z.string(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  tagline: z.string().optional(),
})

export type Home = z.infer<typeof Home>

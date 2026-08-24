import { z } from "zod"

export const Author = z.object({
  name: z.string(),
  slug: z.string(),
  email: z.string().optional(),
  tagline: z.string().optional(),
  location: z.string().optional(),
  body: z.any().optional(),
  photo: z.string().optional(),
  photoWidth: z.number().optional(),
  photoHeight: z.number().optional(),
  social: z.record(z.string(), z.string()).optional(),
})

export type Author = z.infer<typeof Author>

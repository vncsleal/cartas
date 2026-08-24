import { z } from "zod"

export const Post = z.object({
  title: z.string(),
  slug: z.string(),
  author: z.string(),
  description: z.string().optional(),
  date: z.string(),
  cover: z.string().optional(),
  coverWidth: z.number().optional(),
  coverHeight: z.number().optional(),
  coverCrop: z
    .object({
      left: z.number(),
      top: z.number(),
      right: z.number(),
      bottom: z.number(),
    })
    .optional(),
  coverHotspot: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  body: z.any().optional(),
  topics: z.array(z.string()).optional(),
})

export type Post = z.infer<typeof Post>

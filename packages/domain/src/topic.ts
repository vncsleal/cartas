import { z } from "zod"

export const Topic = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
})

export type Topic = z.infer<typeof Topic>

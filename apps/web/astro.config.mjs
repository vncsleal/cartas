import { defineConfig } from "astro/config"
import sanity from "@sanity/astro"

// Public identifiers, safe to default: the project id ships in the client
// bundle regardless. Env vars still take precedence when present.
const sanityProjectId = process.env.PUBLIC_SANITY_PROJECT_ID ?? "heo4fpl2"
const sanityDataset = process.env.PUBLIC_SANITY_DATASET ?? "production"

export default defineConfig({
  site: "https://cartasparaumastronauta.pages.dev",
  output: "static",
  integrations: [
    sanity({
      projectId: sanityProjectId,
      dataset: sanityDataset,
      useCdn: false,
    }),
  ],
})

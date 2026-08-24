import { defineConfig } from "astro/config"
import { readFileSync } from "fs"
import { resolve } from "path"
import sanity from "@sanity/astro"

// Vite/import.meta.env doesn't expose user env vars during config loading,
// so fall back to reading .env manually. On Cloudflare, process.env is populated.
function getSanityProjectId() {
  if (process.env.PUBLIC_SANITY_PROJECT_ID) return process.env.PUBLIC_SANITY_PROJECT_ID
  try {
    const env = readFileSync(resolve(process.cwd(), ".env"), "utf-8")
    const match = env.match(/^PUBLIC_SANITY_PROJECT_ID=(.+)$/m)
    if (match) return match[1].trim()
  } catch {
    /* .env may not exist in all environments */
  }
  throw new Error(
    "PUBLIC_SANITY_PROJECT_ID is required. Add it to .env: PUBLIC_SANITY_PROJECT_ID=heo4fpl2"
  )
}

function getSanityDataset() {
  if (process.env.PUBLIC_SANITY_DATASET) return process.env.PUBLIC_SANITY_DATASET
  try {
    const env = readFileSync(resolve(process.cwd(), ".env"), "utf-8")
    const match = env.match(/^PUBLIC_SANITY_DATASET=(.+)$/m)
    if (match) return match[1].trim()
  } catch {
    /* .env may not exist in all environments */
  }
  return "production"
}

const sanityProjectId = getSanityProjectId()
const sanityDataset = getSanityDataset()

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

import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import { unsplashImageAsset } from "sanity-plugin-asset-source-unsplash"
import { schemaTypes } from "./schema"

export default defineConfig({
  name: "default",
  title: "Cartas para um Astronauta",
  projectId: "heo4fpl2",
  dataset: "production",
  plugins: [structureTool(), unsplashImageAsset()],
  schema: {
    types: schemaTypes,
  },
})

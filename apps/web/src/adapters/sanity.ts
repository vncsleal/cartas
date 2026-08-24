import { sanityClient } from "sanity:client"
import { createStore } from "@cartas/adapter-sanity"

export const store = createStore(sanityClient)

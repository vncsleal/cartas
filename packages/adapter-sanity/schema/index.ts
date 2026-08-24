import { defineType, defineField } from "sanity"
import { UserIcon, DocumentTextIcon, TagIcon, HomeIcon, ComposeIcon } from "@sanity/icons"

const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "name" }, validation: (r) => r.required() }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "tagline", type: "string", title: "Tagline" }),
    defineField({ name: "location", type: "string", title: "Location" }),
    defineField({
      name: "body",
      title: "About",
      type: "array",
      of: [{ type: "block" }, { type: "image" }],
    }),
    defineField({
      name: "photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "social",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "platform", type: "string" }),
            defineField({ name: "url", type: "url" }),
          ],
        },
      ],
    }),
  ],
})

const topic = defineType({
  name: "topic",
  title: "Topic",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "description", type: "text" }),
  ],
})

const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "description", type: "text" }),
    defineField({ name: "date", type: "date", validation: (r) => r.required() }),
    defineField({
      name: "cover",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "author",
      type: "reference",
      to: [{ type: "author" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      type: "array",
      of: [{ type: "block" }, { type: "image" }],
    }),
    defineField({
      name: "topics",
      type: "array",
      of: [{ type: "reference", to: [{ type: "topic" }] }],
    }),
  ],
  orderings: [
    { title: "Date", name: "date", by: [{ field: "date", direction: "desc" }] },
  ],
})

const home = defineType({
  name: "home",
  title: "Home",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({ name: "pageTitle", type: "string", validation: (r) => r.required() }),
    defineField({ name: "seoTitle", type: "string" }),
    defineField({ name: "seoDescription", type: "text" }),
    defineField({ name: "tagline", type: "string", title: "Tagline" }),
  ],
})

const blog = defineType({
  name: "blog",
  title: "Blog",
  type: "document",
  icon: ComposeIcon,
  fields: [
    defineField({ name: "pageTitle", type: "string", validation: (r) => r.required() }),
    defineField({ name: "seoTitle", type: "string" }),
    defineField({ name: "seoDescription", type: "text" }),
    defineField({ name: "tagline", type: "string", title: "Tagline" }),
    defineField({ name: "emptyState", type: "text" }),
  ],
})

export const schemaTypes = [author, topic, post, home, blog]

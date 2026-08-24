import type { Author } from "./author.js"
import type { Post } from "./post.js"
import type { Topic } from "./topic.js"
import type { Home } from "./experience/home.js"
import type { Blog } from "./experience/blog.js"

export interface ContentStore {
  getAuthor(): Promise<Author | null>
  getPosts(): Promise<Post[]>
  getPost(slug: string): Promise<Post | null>
  getTopics(): Promise<Topic[]>
  getHome(): Promise<Home | null>
  getBlog(): Promise<Blog | null>
}

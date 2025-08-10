// 修改为直接导出 sql 对象，而不是使用 drizzle ORM
import { neon } from "@neondatabase/serverless"

// 创建数据库连接并导出
export const db = neon(process.env.DATABASE_URL!)

// 帖子类型定义
export type Post = {
  id: number
  title: string
  content: string
  status: string
  created_at: Date
  updated_at: Date
  user_id: number
}

// 图片类型定义
export type Image = {
  id: number
  post_id: number
  url: string
  file_name: string | null
  display_order: number
}

// 标签类型定义
export type Tag = {
  id: number
  name: string
}

// 完整帖子类型（包含图片和标签）
export type CompletePost = Post & {
  images: Image[]
  tags: Tag[]
}

export type Kv = {
  key: string
  data: object
}
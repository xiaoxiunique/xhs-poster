// 帖子类型定义
export type Post = {
  id: number
  title: string
  content: string
  status: string
  created_at: string | Date
  updated_at: string | Date
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

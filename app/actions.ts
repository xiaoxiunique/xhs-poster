"use server"

import { revalidatePath } from "next/cache"
import type { CompletePost } from "@/lib/db"
import { deletePostFromHost, getPostFromHost, listPosts, savePostToHost } from "@/lib/host-storage"

// 保存帖子
export async function savePost(formData: FormData) {
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const tagsJson = formData.get("tags") as string
  const imagesJson = formData.get("images") as string
  const status = (formData.get("status") as string) || "draft"
  const postId = formData.get("postId") as string

  const tags = JSON.parse(tagsJson) as string[]
  const images = JSON.parse(imagesJson) as string[]

  try {
    const result = await savePostToHost({
      postId: postId ? Number.parseInt(postId) : undefined,
      title,
      content,
      status,
      tags,
      images,
    })

    revalidatePath("/")
    return result
  } catch (error) {
    console.error("保存帖子失败:", error)
    return { success: false, error: "保存帖子失败" }
  }
}

// 获取所有帖子
export async function getPosts() {
  try {
    const { posts } = await listPosts()
    return posts
  } catch (error) {
    console.error("获取帖子列表失败:", error)
    return []
  }
}

// 获取单个帖子的完整信息
export async function getPostById(id: number): Promise<CompletePost | null> {
  try {
    const { post } = await getPostFromHost(id)
    return post
  } catch (error) {
    console.error("获取帖子详情失败:", error)
    return null
  }
}

// 删除帖子
export async function deletePost(formData: FormData) {
  const postId = formData.get("postId") as string

  try {
    await deletePostFromHost(Number.parseInt(postId))
    revalidatePath("/")
  } catch (error) {
    console.error("删除帖子失败:", error)
    throw new Error("删除帖子失败")
  }
}

"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { CompletePost } from "@/lib/db"

// 默认用户ID（在实际应用中应该使用认证系统）
const DEFAULT_USER_ID = 1

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
    let post_id: number

    if (postId) {
      // 更新现有帖子
      await db.query(
        `
        UPDATE posts 
        SET title = $1, content = $2, status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `,
        [title, content, status, Number.parseInt(postId)],
      )
      post_id = Number.parseInt(postId)

      // 删除现有图片和标签关联
      await db.query(`DELETE FROM images WHERE post_id = $1`, [post_id])
      await db.query(`DELETE FROM post_tags WHERE post_id = $1`, [post_id])
    } else {
      // 创建新帖子
      const result = await db.query(
        `
        INSERT INTO posts (user_id, title, content, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
        [DEFAULT_USER_ID, title, content, status],
      )
      post_id = result[0].id
    }

    // 保存图片
    for (let i = 0; i < images.length; i++) {
      await db.query(
        `
        INSERT INTO images (post_id, url, display_order)
        VALUES ($1, $2, $3)
      `,
        [post_id, images[i], i],
      )
    }

    // 保存标签
    for (const tagName of tags) {
      // 检查标签是否存在，不存在则创建
      const existingTag = await db.query(
        `
        SELECT id FROM tags WHERE name = $1
      `,
        [tagName],
      )

      let tag_id: number

      if (existingTag.length === 0) {
        // 创建新标签
        const newTag = await db.query(
          `
          INSERT INTO tags (name)
          VALUES ($1)
          RETURNING id
        `,
          [tagName],
        )
        tag_id = newTag[0].id
      } else {
        tag_id = existingTag[0].id
      }

      // 关联标签和帖子
      await db.query(
        `
        INSERT INTO post_tags (post_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (post_id, tag_id) DO NOTHING
      `,
        [post_id, tag_id],
      )
    }

    revalidatePath("/")
    // 不直接使用 redirect，而是返回成功状态和重定向路径
    return { success: true, postId: post_id, redirectTo: "/" }
  } catch (error) {
    console.error("保存帖子失败:", error)
    return { success: false, error: "保存帖子失败" }
  }
}

// 获取所有帖子
export async function getPosts() {
  try {
    // 获取帖子基本信息
    const posts = await db.query(
      `
      SELECT 
        p.id, p.title, p.content, p.status, p.created_at, p.updated_at, p.user_id
      FROM 
        posts p
      WHERE 
        p.user_id = $1
      ORDER BY 
        p.updated_at DESC
    `,
      [DEFAULT_USER_ID],
    )

    // 为每个帖子获取所有图片和标签
    const postsWithImagesAndTags = await Promise.all(
      posts.map(async (post) => {
        // 获取图片
        const images = await db.query(
          `
          SELECT url
          FROM images
          WHERE post_id = $1
          ORDER BY display_order ASC
        `,
          [post.id],
        )

        // 获取标签
        const tags = await db.query(
          `
          SELECT t.name
          FROM tags t
          JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = $1
        `,
          [post.id],
        )

        return {
          ...post,
          coverImage: images.length > 0 ? images[0].url : null,
          images: images.map((img) => img.url),
          tags: tags.map((tag) => tag.name),
        }
      }),
    )

    return postsWithImagesAndTags
  } catch (error) {
    console.error("获取帖子列表失败:", error)
    return []
  }
}

// 获取单个帖子的完整信息
export async function getPostById(id: number): Promise<CompletePost | null> {
  try {
    // 获取帖子基本信息
    const posts = await db.query(
      `
      SELECT 
        p.id, p.title, p.content, p.status, p.created_at, p.updated_at, p.user_id
      FROM 
        posts p
      WHERE 
        p.id = $1
    `,
      [id],
    )

    if (posts.length === 0) {
      return null
    }

    const post = posts[0]

    // 获取帖子图片
    const images = await db.query(
      `
      SELECT 
        id, post_id, url, file_name, display_order
      FROM 
        images
      WHERE 
        post_id = $1
      ORDER BY 
        display_order ASC
    `,
      [id],
    )

    // 获取帖子标签
    const tags = await db.query(
      `
      SELECT 
        t.id, t.name
      FROM 
        tags t
      JOIN 
        post_tags pt ON t.id = pt.tag_id
      WHERE 
        pt.post_id = $1
    `,
      [id],
    )

    return {
      ...post,
      images,
      tags,
    }
  } catch (error) {
    console.error("获取帖子详情失败:", error)
    return null
  }
}

// 删除帖子
export async function deletePost(formData: FormData) {
  const postId = formData.get("postId") as string

  try {
    await db.query(`DELETE FROM posts WHERE id = $1`, [Number.parseInt(postId)])
    revalidatePath("/")
  } catch (error) {
    console.error("删除帖子失败:", error)
    throw new Error("删除帖子失败")
  }
}

"use client"

import { useState, useEffect } from "react"
import { getPosts } from "./actions"
import { PostGrid, PostGridSkeleton } from "@/components/post-grid"
import { CategoryTabs } from "@/components/category-tabs"
import { AppLayout } from "@/components/app-layout"

type PostSummary = {
  id: number
  title: string
  content: string
  status: string
  created_at: string | Date
  updated_at: string | Date
  user_id: number
  coverImage?: string | null
  images?: string[]
  tags?: string[]
}

export default function Home() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [filteredPosts, setFilteredPosts] = useState<PostSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true)
      try {
        const postsData = await getPosts()
        setPosts(postsData)
        setFilteredPosts(postsData)
      } catch (error) {
        console.error("获取帖子失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const handleFilterChange = (category: string) => {
    if (category === "all") {
      setFilteredPosts(posts)
    } else if (category === "draft") {
      setFilteredPosts(posts.filter((post) => post.status === "draft"))
    } else if (category === "published") {
      setFilteredPosts(posts.filter((post) => post.status === "published"))
    } else if (category.startsWith("tag-")) {
      // 提取标签名称
      const tagName = category.replace("tag-", "")

      // 过滤包含该标签的帖子
      const filtered = posts.filter((post) => {
        // 检查帖子是否有标签数组
        if (!post.tags) return false

        // 将标签数组转换为标签名称数组
        const tagNames = Array.isArray(post.tags) ? post.tags : []
        return tagNames.includes(tagName)
      })

      setFilteredPosts(filtered)
    }
  }

  return (
    <AppLayout>
      {/* 分类标签 */}
      <CategoryTabs posts={posts} onFilterChange={handleFilterChange} />

      {/* 帖子网格 */}
      <div className="mt-4">
        {isLoading ? (
          <PostGridSkeleton />
        ) : (
          <PostGrid posts={filteredPosts} />
        )}
      </div>
    </AppLayout>
  )
}

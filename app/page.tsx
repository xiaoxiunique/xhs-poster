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
    } else if (category === "uncategorized") {
      setFilteredPosts(posts.filter((post) => !post.tags || post.tags.length === 0))
    } else if (category.startsWith("category-")) {
      const categoryName = decodeURIComponent(category.replace("category-", ""))
      const filtered = posts.filter((post) => {
        if (!post.tags) return false
        const categoryNames = Array.isArray(post.tags) ? post.tags : []
        return categoryNames.includes(categoryName)
      })

      setFilteredPosts(filtered)
    }
  }

  return (
    <AppLayout>
      <CategoryTabs posts={posts} onFilterChange={handleFilterChange} />

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

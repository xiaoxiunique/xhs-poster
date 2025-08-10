"use client"

import { useState, useEffect } from "react"
import { getPosts } from "./actions"
import { PostGrid } from "@/components/post-grid"
import { CategoryTabs } from "@/components/category-tabs"
import { AppLayout } from "@/components/app-layout"

export default function Home() {
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true)
      try {
        const postsData = await getPosts()
        console.log("获取到的帖子数据:", postsData)
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
    console.log("选择的分类:", category)

    if (category === "all") {
      setFilteredPosts(posts)
    } else if (category === "draft") {
      setFilteredPosts(posts.filter((post) => post.status === "draft"))
    } else if (category === "published") {
      setFilteredPosts(posts.filter((post) => post.status === "published"))
    } else if (category.startsWith("tag-")) {
      // 提取标签名称
      const tagName = category.replace("tag-", "")
      console.log("过滤标签:", tagName)

      // 过滤包含该标签的帖子
      const filtered = posts.filter((post) => {
        // 检查帖子是否有标签数组
        if (!post.tags) return false

        // 将标签数组转换为标签名称数组
        const tagNames = Array.isArray(post.tags)
          ? post.tags.map((tag) => (typeof tag === "string" ? tag : tag.name))
          : []

        console.log("帖子标签:", tagNames)
        return tagNames.includes(tagName)
      })

      console.log("过滤后的帖子:", filtered)
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : (
          <PostGrid posts={filteredPosts} />
        )}
      </div>
    </AppLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface CategoryTabsProps {
  posts: any[]
  onFilterChange: (category: string) => void
}

export function CategoryTabs({ posts, onFilterChange }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([
    { id: "all", name: "全部" },
    { id: "draft", name: "草稿" },
    { id: "published", name: "已发布" },
  ])

  // 从帖子标签中提取分类
  useEffect(() => {
    if (!posts || posts.length === 0) return

    console.log("提取标签的帖子数据:", posts)

    // 收集所有标签
    const allTags: string[] = []
    posts.forEach((post) => {
      // 检查帖子是否有标签
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: any) => {
          // 处理不同格式的标签
          if (typeof tag === "string") {
            allTags.push(tag)
          } else if (tag && typeof tag === "object" && tag.name) {
            allTags.push(tag.name)
          }
        })
      }
    })

    console.log("提取的所有标签:", allTags)

    // 获取唯一标签
    const uniqueTags = [...new Set(allTags)]
    console.log("唯一标签:", uniqueTags)

    // 将标签转换为分类格式
    const tagCategories = uniqueTags.map((tag) => ({ id: `tag-${tag}`, name: tag }))

    // 合并默认分类和标签分类
    const newCategories = [
      { id: "all", name: "全部" },
      { id: "draft", name: "草稿" },
      { id: "published", name: "已发布" },
      ...tagCategories,
    ]

    console.log("设置分类:", newCategories)
    setCategories(newCategories)
  }, [posts])

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    onFilterChange(categoryId)
  }

  return (
    <div className="relative">
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                "px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors",
                activeCategory === category.id
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { normalizeMaterialCategories, type MaterialCategory } from "@/lib/material-categories"

interface CategoryTabsProps {
  posts: any[]
  onFilterChange: (category: string) => void
}

export function CategoryTabs({ posts, onFilterChange }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [managedCategories, setManagedCategories] = useState<MaterialCategory[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([
    { id: "all", name: "全部" },
    { id: "draft", name: "草稿" },
    { id: "published", name: "已发布" },
  ])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/settings")
        if (!response.ok) throw new Error("获取素材分类失败")
        const data = await response.json()
        setManagedCategories(normalizeMaterialCategories(data.materialCategories))
      } catch (error) {
        console.error("获取素材分类失败:", error)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const assignedCategories: string[] = []
    posts?.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: any) => {
          if (typeof tag === "string") {
            assignedCategories.push(tag)
          } else if (tag && typeof tag === "object" && tag.name) {
            assignedCategories.push(tag.name)
          }
        })
      }
    })

    const categoryNames = [
      ...managedCategories.map((category) => category.name),
      ...assignedCategories.filter((name) => !managedCategories.some((category) => category.name === name)),
    ]
    const hasUncategorized = posts?.some((post) => !post.tags || post.tags.length === 0)
    const newCategories = [
      { id: "all", name: "全部" },
      { id: "draft", name: "草稿" },
      { id: "published", name: "已发布" },
      ...(hasUncategorized ? [{ id: "uncategorized", name: "未归类" }] : []),
      ...[...new Set(categoryNames)].map((name) => ({ id: `category-${encodeURIComponent(name)}`, name })),
    ]

    setCategories(newCategories)
  }, [managedCategories, posts])

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

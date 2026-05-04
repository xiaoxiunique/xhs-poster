"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { normalizeMaterialCategories, type MaterialCategory } from "@/lib/material-categories"
import { cn } from "@/lib/utils"

type MaterialCategorySelectProps = {
  value: string[]
  onChange: (categories: string[]) => void
}

export function MaterialCategorySelect({ value, onChange }: MaterialCategorySelectProps) {
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/settings")
        if (!response.ok) throw new Error("获取分类失败")
        const data = await response.json()
        setCategories(normalizeMaterialCategories(data.materialCategories))
      } catch (error) {
        console.error("获取素材分类失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const toggleCategory = (name: string) => {
    onChange(value.includes(name) ? value.filter((item) => item !== name) : [...value, name])
  }

  if (isLoading) {
    return <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
        <span className="text-sm text-muted-foreground">暂无素材分类</span>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/settings">去添加</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const active = value.includes(category.name)
        return (
          <button key={category.id} type="button" onClick={() => toggleCategory(category.name)}>
            <Badge
              variant={active ? "default" : "outline"}
              className={cn("cursor-pointer px-3 py-1.5", active && "bg-red-500 hover:bg-red-600")}
            >
              {category.name}
            </Badge>
          </button>
        )
      })}
    </div>
  )
}

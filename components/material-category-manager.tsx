"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { createMaterialCategory, type MaterialCategory } from "@/lib/material-categories"

type MaterialCategoryManagerProps = {
  categories: MaterialCategory[]
  onChange: (categories: MaterialCategory[]) => void
}

export function MaterialCategoryManager({ categories, onChange }: MaterialCategoryManagerProps) {
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const addCategory = () => {
    const name = newName.trim()
    if (!name || categories.some((category) => category.name === name)) return
    onChange([...categories, createMaterialCategory(name)])
    setNewName("")
  }

  const startEdit = (category: MaterialCategory) => {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  const saveEdit = () => {
    const name = editingName.trim()
    if (!editingId || !name) return
    if (categories.some((category) => category.id !== editingId && category.name === name)) return
    onChange(categories.map((category) => (category.id === editingId ? { ...category, name } : category)))
    setEditingId(null)
    setEditingName("")
  }

  const removeCategory = (id: string) => {
    onChange(categories.filter((category) => category.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              addCategory()
            }
          }}
          placeholder="输入分类名称"
        />
        <Button type="button" onClick={addCategory} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          添加
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.length === 0 && <span className="text-sm text-muted-foreground">暂无分类</span>}
        {categories.map((category) =>
          editingId === category.id ? (
            <div key={category.id} className="flex items-center gap-1 rounded-md border bg-white px-2 py-1">
              <Input
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    saveEdit()
                  }
                  if (event.key === "Escape") {
                    setEditingId(null)
                    setEditingName("")
                  }
                }}
                className="h-7 w-32"
                autoFocus
              />
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={saveEdit}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setEditingId(null)
                  setEditingName("")
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Badge key={category.id} variant="outline" className="gap-1.5 px-3 py-1.5">
              {category.name}
              <button type="button" onClick={() => startEdit(category)} aria-label={`编辑分类 ${category.name}`}>
                <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
              <button type="button" onClick={() => removeCategory(category.id)} aria-label={`删除分类 ${category.name}`}>
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ),
        )}
      </div>
    </div>
  )
}

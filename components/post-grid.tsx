"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ChevronLeft, ChevronRight, Loader2, ImageIcon } from "lucide-react"
import Link from "next/link"
import { deletePost } from "@/app/actions"
import { useFormStatus } from "react-dom"
import { useToast } from "@/hooks/use-toast"
import { ImageViewerDialog } from "./image-viewer-dialog"

interface Post {
  id: number
  title: string
  content: string
  status: string
  created_at: string | Date
  updated_at: string | Date
  user_id: number
  coverImage?: string | null
  images?: string[]
}

interface PostGridProps {
  posts: Post[]
}

// 删除按钮组件
function DeleteButton() {
  const { pending } = useFormStatus()

  return (
    <Button variant="outline" size="sm" type="submit" disabled={pending} className="flex items-center gap-1">
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          删除中...
        </>
      ) : (
        <>
          <Trash2 className="w-4 h-4" />
          删除
        </>
      )}
    </Button>
  )
}

// 单个帖子卡片组件
function PostCard({ post }: { post: Post }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { toast } = useToast()
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // 确保图片数组是有效的
  const images = post.images && post.images.length > 0 ? post.images : post.coverImage ? [post.coverImage] : []
  const hasMultipleImages = images.length > 1
  const currentImage = images[currentIndex] || ""

  useEffect(() => {
    setImageLoaded(false)
  }, [currentImage])

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  // 处理图片点击
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (images.length > 0) {
      setIsImageViewerOpen(true)
    }
  }

  // 处理删除操作
  const handleDelete = async (formData: FormData) => {
    try {
      await deletePost(formData)
      toast({
        title: "删除成功",
        description: "帖子已成功删除",
      })
    } catch (error) {
      console.error("删除失败:", error)
      toast({
        title: "删除失败",
        description: "无法删除帖子，请重试",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card className="overflow-hidden flex flex-col rounded-xl shadow-sm w-full">
        <div className="flex-1 cursor-pointer" onClick={() => (window.location.href = `/edit/${post.id}`)}>
          {/* 图片区域 */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 group">
            {images.length > 0 ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 z-[1] animate-pulse bg-gray-100">
                    <div className="h-full w-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100" />
                  </div>
                )}
                <img
                  src={currentImage || "/placeholder.svg"}
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full cursor-zoom-in object-cover transition-opacity duration-200 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onClick={handleImageClick}
                  onLoad={() => setImageLoaded(true)}
                />

                {hasMultipleImages && (
                  <>
                    {/* 图片计数器 */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-10">
                      {currentIndex + 1}/{images.length}
                    </div>

                    {/* 导航按钮 */}
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      aria-label="上一张图片"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      aria-label="下一张图片"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                <ImageIcon className="h-8 w-8 opacity-50" />
                <span className="text-xs">无图片</span>
              </div>
            )}

            {/* 状态标签 */}
            <div className="absolute top-2 left-2 z-10">
              <Badge variant={post.status === "draft" ? "outline" : "default"} className="bg-white/80 text-gray-800">
                {post.status === "draft" ? "草稿" : "已发布"}
              </Badge>
            </div>
          </div>

          {/* 标题区域 - 小红书风格 */}
          <div className="p-2">
            <h3 className="font-medium text-xs line-clamp-2">{post.title}</h3>
          </div>
        </div>

        {/* 底部操作区 - 简化版 */}
        <div className="px-2 py-1.5 border-t flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-200"></div>
            <span className="text-xs text-gray-500 truncate max-w-[60px]">小红书号</span>
          </div>
          <div className="flex gap-1">
            <form action={handleDelete}>
              <input type="hidden" name="postId" value={post.id} />
              <Button variant="ghost" size="icon" type="submit" className="h-6 w-6">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </form>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = `/edit/${post.id}`
              }}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 图片查看器对话框 */}
      <ImageViewerDialog
        images={images}
        initialIndex={currentIndex}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </>
  )
}

function SkeletonCard() {
  return (
    <Card className="mb-3 break-inside-avoid overflow-hidden rounded-xl shadow-sm">
      <div className="aspect-[4/5] w-full animate-pulse bg-gray-100" />
      <div className="space-y-2 p-2">
        <div className="h-3 w-5/6 rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
      <div className="flex items-center justify-between border-t px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-gray-100" />
          <div className="h-3 w-14 rounded bg-gray-100" />
        </div>
        <div className="flex gap-1">
          <div className="h-6 w-6 rounded bg-gray-100" />
          <div className="h-6 w-6 rounded bg-gray-100" />
        </div>
      </div>
    </Card>
  )
}

export function PostGridSkeleton() {
  return (
    <div
      className="w-full"
      style={{
        columnCount: 5,
        columnGap: "12px",
        columnWidth: "200px",
      }}
    >
      {Array.from({ length: 10 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}

export function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium mb-2">还没有帖子</h2>
        <p className="text-muted-foreground mb-6">创建你的第一个小红书帖子吧！</p>
        <Link href="/create">
          <Button className="bg-red-500 hover:bg-red-600">创建帖子</Button>
        </Link>
      </div>
    )
  }

  return (
    <div
      className="w-full"
      style={{
        columnCount: 5,
        columnGap: "12px",
        columnWidth: "200px",
      }}
    >
      {posts.map((post) => (
        <div key={post.id} className="break-inside-avoid mb-3">
          <PostCard post={post} />
        </div>
      ))}
    </div>
  )
}

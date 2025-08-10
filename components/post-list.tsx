"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ImageIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { deletePost } from "@/app/actions"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useState, useEffect } from "react"
import { useFormStatus } from "react-dom"

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

interface PostListProps {
  posts: Post[]
}

// 删除按钮组件，使用useFormStatus跟踪表单提交状态
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
  const [isDeleting, setIsDeleting] = useState(false)

  // 确保图片数组是有效的
  const images = post.images && post.images.length > 0 ? post.images : post.coverImage ? [post.coverImage] : []

  // 重置索引，当图片数组变化时
  useEffect(() => {
    setCurrentIndex(0)
  }, [images])

  const hasMultipleImages = images.length > 1

  const nextImage = () => {
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  // 处理删除操作
  const handleDelete = async (formData: FormData) => {
    setIsDeleting(true)
    try {
      await deletePost(formData)
    } catch (error) {
      console.error("删除失败:", error)
      setIsDeleting(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* 图片预览区域 */}
        <div className="md:w-1/3 lg:w-1/4">
          {images.length > 0 ? (
            <div className="relative aspect-square md:aspect-[4/3] w-full group bg-muted">
              <img
                src={images[currentIndex] || "/placeholder.svg"}
                alt={`${post.title} - 图片 ${currentIndex + 1}`}
                className="object-contain w-full h-full"
              />

              {hasMultipleImages && (
                <>
                  {/* 图片计数器 */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {currentIndex + 1}/{images.length}
                  </div>

                  {/* 导航按钮 */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      prevImage()
                    }}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="上一张图片"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      nextImage()
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="下一张图片"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* 指示器 */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setCurrentIndex(idx)
                        }}
                        className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? "bg-white" : "bg-white/50"}`}
                        aria-label={`查看第 ${idx + 1} 张图片`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center bg-muted aspect-square md:aspect-[4/3] w-full">
              <ImageIcon className="w-12 h-12 text-muted-foreground opacity-30" />
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex flex-col flex-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold line-clamp-1">{post.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true, locale: zhCN })}更新
                </p>
              </div>
              <Badge variant={post.status === "draft" ? "outline" : "default"}>
                {post.status === "draft" ? "草稿" : "已发布"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 text-muted-foreground">{post.content}</p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 mt-auto">
            <form action={handleDelete}>
              <input type="hidden" name="postId" value={post.id} />
              <DeleteButton />
            </form>
            <Link href={`/edit/${post.id}`}>
              <Button size="sm" className="flex items-center gap-1">
                <Edit className="w-4 h-4" />
                编辑
              </Button>
            </Link>
          </CardFooter>
        </div>
      </div>
    </Card>
  )
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium mb-2">还没有帖子</h2>
        <p className="text-muted-foreground mb-6">创建你的第一个小红书帖子吧！</p>
        <Link href="/create">
          <Button>创建帖子</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

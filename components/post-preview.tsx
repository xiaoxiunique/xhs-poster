"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageSquare, Bookmark, Share2, ChevronLeft, ChevronRight } from "lucide-react"
import type { PostData } from "./xiaohongshu-form"

interface PostPreviewProps {
  postData: PostData
}

export function PostPreview({ postData }: PostPreviewProps) {
  const { title, content, tags, images } = postData
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!title && !content && images.length === 0 && tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
        <h3 className="text-lg font-medium mb-2">暂无预览内容</h3>
        <p className="text-muted-foreground">请在编辑页面添加内容后查看预览</p>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-400 to-red-500"></div>
          <div>
            <h3 className="font-medium text-sm">用户名</h3>
            <p className="text-xs text-muted-foreground">小红书号: XXXXXXX</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {images.length > 0 && (
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={images[currentImageIndex] || "/placeholder.svg"}
              alt="封面图"
              className="w-full h-full object-cover"
            />

            {images.length > 1 && (
              <>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1}/{images.length}
                </div>

                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full"
                  aria-label="上一张图片"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full"
                  aria-label="下一张图片"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-1.5 h-1.5 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                      aria-label={`查看第 ${index + 1} 张图片`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {title && <h2 className="font-bold text-lg leading-tight">{title}</h2>}

        {content && (
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {content.length > 100 ? `${content.substring(0, 100)}...` : content}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="font-normal text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <div className="flex items-center gap-1">
            <Heart className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">0</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">0</span>
          </div>
          <div className="flex items-center gap-1">
            <Bookmark className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">收藏</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">分享</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react"

interface ImageViewerDialogProps {
  images: string[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageViewerDialog({ images, initialIndex, open, onOpenChange }: ImageViewerDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)

  // 重置缩放比例当图片改变时
  useEffect(() => {
    setScale(1)
  }, [currentIndex])

  // 当对话框打开时，设置初始索引
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
    }
  }, [open, initialIndex])

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case "ArrowRight":
          nextImage()
          break
        case "ArrowLeft":
          prevImage()
          break
        case "Escape":
          onOpenChange(false)
          break
        case "+":
          zoomIn()
          break
        case "-":
          zoomOut()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (images.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/90 border-none">
        <div className="relative w-full h-[80vh] flex items-center justify-center">
          {/* 关闭按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/70"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* 图片计数器 */}
          <div className="absolute top-4 left-4 z-50 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* 缩放控制 */}
          <div className="absolute bottom-4 left-4 z-50 flex gap-2">
            <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/70" onClick={zoomOut}>
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/70" onClick={zoomIn}>
              <ZoomIn className="h-5 w-5" />
            </Button>
          </div>

          {/* 图片 */}
          <div className="flex flex-col h-full w-full">
            {/* 主图区域 */}
            <div
              className="flex-1 w-full flex items-center justify-center overflow-hidden relative"
              style={{
                cursor: "grab",
              }}
            >
              <img
                src={images[currentIndex] || "/placeholder.svg"}
                alt={`图片 ${currentIndex + 1}`}
                className="max-h-full max-w-full transition-transform duration-200 ease-in-out absolute"
                style={{
                  transform: `scale(${scale})`,
                  objectFit: "contain",
                }}
              />
            </div>

            {/* 缩略图导航 */}
            {images.length > 1 && (
              <div className="h-20 min-h-20 w-full bg-black/50 flex items-center justify-center p-2">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`h-16 w-16 flex-shrink-0 cursor-pointer border-2 transition-all ${
                        idx === currentIndex
                          ? "border-white opacity-100"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`缩略图 ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 导航按钮 */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 z-50"
                onClick={prevImage}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 z-50"
                onClick={nextImage}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

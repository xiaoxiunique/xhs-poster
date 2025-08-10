"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Upload, ImageIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void
  maxImages?: number
  initialImages?: string[]
}

export function ImageUpload({ onImagesChange, maxImages = 18, initialImages = [] }: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (initialImages.length > 0) {
      setImages(initialImages)
    }
  }, [initialImages])

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    setUploadProgress((prev) => ({ ...prev, [uniqueId]: 0 }))

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "上传失败")
      }

      const data = await response.json()
      setUploadProgress((prev) => ({ ...prev, [uniqueId]: 100 }))
      return data.url
    } catch (error) {
      console.error("上传失败:", error)
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "图片上传失败，请重试",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const totalImages = images.length + newFiles.length

      if (totalImages > maxImages) {
        toast({
          title: "超出最大图片数量",
          description: `最多只能上传${maxImages}张图片`,
          variant: "destructive",
        })
        return
      }

      setUploading(true)

      try {
        // 上传所有文件到Blob存储
        const uploadPromises = newFiles.map((file) => uploadFile(file))
        const newImageUrls = await Promise.all(uploadPromises)

        const updatedImages = [...images, ...newImageUrls]
        setImages(updatedImages)
        onImagesChange(updatedImages)

        toast({
          title: "上传成功",
          description: `成功上传${newFiles.length}张图片`,
        })
      } catch (error) {
        console.error("上传过程中出错:", error)
      } finally {
        setUploading(false)
        setUploadProgress({})
        // 重置文件输入，允许重新上传相同的文件
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }

  const removeImage = (index: number) => {
    const updatedImages = [...images]
    updatedImages.splice(index, 1)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOverInner = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropInner = (targetIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      const updatedImages = [...images]
      const draggedImage = updatedImages[draggedIndex]

      // 移除拖动的图片
      updatedImages.splice(draggedIndex, 1)
      // 在目标位置插入
      updatedImages.splice(targetIndex, 0, draggedImage)

      setImages(updatedImages)
      onImagesChange(updatedImages)
      setDraggedIndex(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
      const totalImages = images.length + newFiles.length

      if (totalImages > maxImages) {
        toast({
          title: "超出最大图片数量",
          description: `最多只能上传${maxImages}张图片`,
          variant: "destructive",
        })
        return
      }

      if (newFiles.length === 0) {
        toast({
          title: "无效文件",
          description: "只能上传图片文件",
          variant: "destructive",
        })
        return
      }

      setUploading(true)

      try {
        // 上传所有文件到Blob存储
        const uploadPromises = newFiles.map((file) => uploadFile(file))
        const newImageUrls = await Promise.all(uploadPromises)

        const updatedImages = [...images, ...newImageUrls]
        setImages(updatedImages)
        onImagesChange(updatedImages)

        toast({
          title: "上传成功",
          description: `成功上传${newFiles.length}张图片`,
        })
      } catch (error) {
        console.error("上传过程中出错:", error)
      } finally {
        setUploading(false)
      }
    }
  }

  return (
    <div
      className={`space-y-4 ${isDragging ? "opacity-70" : ""}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 border-2 border-dashed p-4 rounded-lg ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"}`}
      >
        {images.map((image, index) => (
          <Card
            key={index}
            className={`relative group aspect-square overflow-hidden cursor-move ${draggedIndex === index ? "opacity-50 border-2 border-primary" : ""}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOverInner}
            onDrop={() => handleDropInner(index)}
            onDragEnd={() => setDraggedIndex(null)}
          >
            <img
              src={image || "/placeholder.svg"}
              alt={`上传图片 ${index + 1}`}
              className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute top-1 left-1 bg-black/70 text-white px-1.5 py-0.5 text-xs rounded">
              {index + 1}
            </div>
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="删除图片"
            >
              <X className="w-4 h-4" />
            </button>
          </Card>
        ))}

        {uploading && (
          <Card className="flex flex-col items-center justify-center aspect-square bg-muted/20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <span className="text-xs text-muted-foreground">上传中...</span>
          </Card>
        )}

        {!uploading && images.length < maxImages && (
          <Card
            className="flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={triggerFileInput}
          >
            <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">添加图片</span>
          </Card>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
        disabled={uploading}
      />

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {images.length}/{maxImages} 张图片
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isDragging ? "释放鼠标上传图片" : "拖放图片到此处上传"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={images.length >= maxImages || uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                上传图片
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

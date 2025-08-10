"use client"

import { useState, useEffect } from "react"
import { ImageUpload } from "@/components/image-upload"
import { TagInput } from "@/components/tag-input"
import { PostPreview } from "@/components/post-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Eye, Save, ArrowLeft, Sparkles, Loader2, ScanText } from "lucide-react"
import { savePost } from "@/app/actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { CompetitorSearchDialog } from "@/components/competitor-search-dialog"
import { Search } from "lucide-react" // Import Search component
import XhsPoster from "@/lib/xhs"; // 确保引入 XhsPoster
import type { Topic } from "@/components/tag-input"; // 引入 Topic 类型

export type PostData = {
  id?: number
  title: string
  content: string
  tags: string[]
  images: string[]
}

interface XiaohongshuFormProps {
  initialData?: PostData
}

export function XiaohongshuForm({ initialData }: XiaohongshuFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [postData, setPostData] = useState<PostData>(
    initialData || {
      title: "",
      content: "",
      tags: [],
      images: [],
    },
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isTitleOptimizing, setIsTitleOptimizing] = useState(false)
  const [isContentOptimizing, setIsContentOptimizing] = useState(false)
  const [isExtractingText, setIsExtractingText] = useState(false)
  const [isCompetitorDialogOpen, setIsCompetitorDialogOpen] = useState(false)

  // 新增 searchTopics 函数，现在调用 API 路由
  const searchTopics = async (keyword: string): Promise<Topic[]> => {
    if (!keyword.trim()) {
      return [];
    }
    try {
      const response = await fetch("/api/search-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "搜索话题失败，无法解析错误响应" }));
        console.error("Error searching XHS topics (API response not OK):", response.status, errorData);
        toast({
          title: "话题搜索失败",
          description: errorData.error || `服务器错误: ${response.status}`,
          variant: "destructive",
        });
        return [];
      }

      const topics = await response.json();
      return topics as Topic[]; // 假设 API 返回 Topic[] 结构
    } catch (error) {
      console.error("Error searching XHS topics (fetch failed):", error);
      toast({
        title: "话题搜索失败",
        description: "无法连接到服务器或发生网络错误。",
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    // 检查是否有草稿数据
    const draftData = localStorage.getItem("draft_post")
    if (draftData) {
      try {
        const parsedData = JSON.parse(draftData)
        setPostData((prev) => ({
          ...prev,
          title: parsedData.title || prev.title,
          content: parsedData.content || prev.content,
          tags: parsedData.tags || prev.tags,
          images: parsedData.images || prev.images,
        }))

        // 清除草稿数据，避免重复加载
        localStorage.removeItem("draft_post")

        toast({
          title: "草稿已加载",
          description: "竞品帖子内容已导入，您可以进行编辑",
        })
      } catch (error) {
        console.error("加载草稿数据失败:", error)
      }
    }
  }, []) // 空依赖数组，确保只在组件挂载时执行一次

  const handleImageUpload = (imageUrls: string[]) => {
    setPostData((prev) => ({ ...prev, images: imageUrls }))
  }

  const handleTagsChange = (tags: string[]) => {
    setPostData((prev) => ({ ...prev, tags }))
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(postData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    const exportFileDefaultName = `小红书帖子_${new Date().toLocaleDateString()}.json`
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleSave = async (formData: FormData) => {
    setIsSaving(true)
    try {
      // 添加额外的表单数据
      formData.append("tags", JSON.stringify(postData.tags))
      formData.append("images", JSON.stringify(postData.images))
      formData.append("status", "draft")
      if (postData.id) {
        formData.append("postId", postData.id.toString())
      }

      const result = await savePost(formData)

      if (result.success) {
        // 使用 router 进行客户端导航
        router.push(result.redirectTo || "/")
      } else {
        alert(result.error || "保存失败，请重试")
      }
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = postData.title && postData.content && postData.images.length > 0

  const optimizeText = async (text: string, type: "title" | "content") => {
    if (!text.trim()) {
      return
    }

    try {
      if (type === "title") {
        setIsTitleOptimizing(true)
      } else {
        setIsContentOptimizing(true)
      }

      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, type }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "优化失败")
      }

      const data = await response.json()

      // 更新状态
      setPostData((prev) => ({
        ...prev,
        [type]: data.optimizedText,
      }))
    } catch (error) {
      console.error("优化失败:", error)
      alert(error instanceof Error ? error.message : "优化失败，请重试")
    } finally {
      if (type === "title") {
        setIsTitleOptimizing(false)
      } else {
        setIsContentOptimizing(false)
      }
    }
  }

  const extractTextFromImages = async () => {
    if (postData.images.length === 0) {
      toast({
        title: "无法识别图片",
        description: "请先上传至少一张图片",
        variant: "destructive",
      })
      return
    }

    setIsExtractingText(true)
    try {
      const response = await fetch("/api/extract-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: postData.images }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "提取文本失败")
      }

      const data = await response.json()

      if (data.extractedText) {
        // 将提取的文本添加到现有内容中，而不是替换
        setPostData((prev) => {
          const newContent = prev.content
            ? `${prev.content}\n\n提取的文本：\n${data.extractedText}`
            : data.extractedText

          return {
            ...prev,
            content: newContent,
          }
        })

        toast({
          title: "文本提取完成",
          description: "已从图片中提取文本并添加到内容中",
        })
      } else {
        toast({
          title: "未发现文本",
          description: "图片中未检测到可识别的文本内容",
        })
      }
    } catch (error) {
      console.error("提取文本失败:", error)
      toast({
        title: "提取失败",
        description: error instanceof Error ? error.message : "从图片提取文本失败，请重试",
        variant: "destructive",
      })
    } finally {
      setIsExtractingText(false)
    }
  }

  const handleSelectTitle = (title: string) => {
    setPostData((prev) => ({
      ...prev,
      title,
    }))
    setIsCompetitorDialogOpen(false)
    toast({
      title: "已应用标题",
      description: "竞品标题已复制到您的帖子",
    })
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回帖子列表
        </Link>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <span>编辑</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>预览</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Card>
            <CardContent className="pt-6">
              <form action={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">图片上传</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={extractTextFromImages}
                      disabled={isExtractingText || postData.images.length === 0}
                      className="flex items-center gap-2"
                    >
                      {isExtractingText ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          识别中...
                        </>
                      ) : (
                        <>
                          <ScanText className="w-4 h-4" />
                          识别图片文本
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">上传帖子的图片（最多18张）</p>
                  <ImageUpload onImagesChange={handleImageUpload} maxImages={18} initialImages={postData.images} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">标题</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCompetitorDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      搜索竞品帖子
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">输入吸引人的标题（最多20字）</p>
                  <div className="flex gap-2">
                    <Input
                      name="title"
                      placeholder="输入标题..."
                      value={postData.title}
                      onChange={(e) => setPostData((prev) => ({ ...prev, title: e.target.value }))}
                      maxLength={20}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => optimizeText(postData.title, "title")}
                      disabled={!postData.title || isTitleOptimizing}
                      className="shrink-0"
                      title="AI优化标题"
                    >
                      {isTitleOptimizing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-right text-muted-foreground">{postData.title.length}/20</div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">内容</h2>
                  <p className="text-sm text-muted-foreground">详细描述你的内容（最多1000字）</p>
                  <div className="flex gap-2">
                    <Textarea
                      name="content"
                      placeholder="输入正文内容..."
                      className="min-h-[200px] flex-1"
                      value={postData.content}
                      onChange={(e) => setPostData((prev) => ({ ...prev, content: e.target.value }))}
                      maxLength={1000}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => optimizeText(postData.content, "content")}
                      disabled={!postData.content || isContentOptimizing}
                      className="shrink-0 self-start"
                      title="AI优化内容"
                    >
                      {isContentOptimizing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-right text-muted-foreground">{postData.content.length} 字</div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">标签</h2>
                  <p className="text-sm text-muted-foreground">添加相关标签（建议5-10个）</p>
                  <TagInput 
                    tags={postData.tags} 
                    onChange={handleTagsChange} 
                    searchTopics={searchTopics}
                    showCommonTags={true}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExport}
                    className="flex items-center gap-2"
                    disabled={!isFormValid}
                  >
                    <Download className="w-4 h-4" />
                    导出JSON
                  </Button>
                  <Button type="submit" className="flex items-center gap-2" disabled={!isFormValid || isSaving}>
                    <Save className="w-4 h-4" />
                    {isSaving ? "保存中..." : "保存草稿"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <PostPreview postData={postData} />
        </TabsContent>
      </Tabs>
      {/* 竞品帖子对话框 */}
      <CompetitorSearchDialog
        open={isCompetitorDialogOpen}
        onOpenChange={setIsCompetitorDialogOpen}
        initialKeyword={postData.title}
        onSelectTitle={handleSelectTitle}
      />
    </div>
  )
}

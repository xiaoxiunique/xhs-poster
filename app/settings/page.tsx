"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/app-layout"
import { TagInput, Topic } from "@/components/tag-input"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [titlePrompt, setTitlePrompt] = useState("")
  const [contentPrompt, setContentPrompt] = useState("")
  const [commonTags, setCommonTags] = useState<Topic[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // 加载保存的设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/settings")
        if (!response.ok) {
          throw new Error("获取设置失败")
        }
        
        const data = await response.json()
        
        // 设置从服务器获取的数据
        setTitlePrompt(data.titlePrompt || "请将小红书标题优化得更吸引人、更有点击率，同时保持原意，不超过20个字。使用生动的形容词，增加情感色彩。")
        setContentPrompt(data.contentPrompt || "请将小红书正文内容优化，使其更生动、更有吸引力，同时保持原意，不超过1000个字。使用通俗易懂的语言，增加情感共鸣，适当使用emoji表情，分段清晰。")
        setCommonTags(data.commonTags || [])
      } catch (error) {
        console.error("获取设置失败:", error)
        toast({
          title: "获取设置失败",
          description: "无法获取保存的设置，已加载默认设置",
          variant: "destructive",
        })
        
        // 加载默认值
        setTitlePrompt("请将小红书标题优化得更吸引人、更有点击率，同时保持原意，不超过20个字。使用生动的形容词，增加情感色彩。")
        setContentPrompt("请将小红书正文内容优化，使其更生动、更有吸引力，同时保持原意，不超过1000个字。使用通俗易懂的语言，增加情感共鸣，适当使用emoji表情，分段清晰。")
        setCommonTags([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSettings()
  }, [toast])

  const searchTopics = async (keyword: string): Promise<Topic[]> => {
    try {
      const res = await fetch("/api/search-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword }),
      })

      if (!res.ok) {
        throw new Error("搜索话题失败")
      }

      return await res.json()
    } catch (error) {
      console.error("搜索话题错误:", error)
      return []
    }
  }

  const handleTagsChange = (tags: Topic[]) => {
    setCommonTags(tags)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 保存到服务器
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titlePrompt,
          contentPrompt,
          commonTags,
        }),
      })

      if (!response.ok) {
        throw new Error("保存设置失败")
      }

      toast({
        title: "设置已保存",
        description: "您的AI优化提示词和公共标签设置已成功保存",
      })
    } catch (error) {
      console.error("保存设置失败:", error)
      toast({
        title: "保存失败",
        description: "无法保存设置，请重试",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefault = () => {
    // 重置为默认提示词
    setTitlePrompt(
      "请将小红书标题优化得更吸引人、更有点击率，同时保持原意，不超过20个字。使用生动的形容词，增加情感色彩。",
    )
    setContentPrompt(
      "请将小红书正文内容优化，使其更生动、更有吸引力，同时保持原意，不超过1000个字。使用通俗易懂的语言，增加情感共鸣，适当使用emoji表情，分段清晰。",
    )
    setCommonTags([])
  }

  if (isLoading) {
    return (
      <AppLayout title="AI优化设置">
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="AI优化设置">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>标题优化提示词</CardTitle>
            <CardDescription>设置AI优化标题时使用的系统提示词，指导AI如何优化您的标题</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={titlePrompt}
              onChange={(e) => setTitlePrompt(e.target.value)}
              placeholder="输入标题优化提示词..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>内容优化提示词</CardTitle>
            <CardDescription>设置AI优化内容时使用的系统提示词，指导AI如何优化您的正文内容</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={contentPrompt}
              onChange={(e) => setContentPrompt(e.target.value)}
              placeholder="输入内容优化提示词..."
              className="min-h-[150px]"
            />
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>公共标签库</CardTitle>
            <CardDescription>设置常用的标签，这些标签将在创建帖子时自动推荐显示</CardDescription>
          </CardHeader>
          <CardContent>
            <TagInput 
              topics={commonTags} 
              onChange={handleTagsChange} 
              maxTags={50}
              searchTopics={searchTopics}
              isSettingsMode={true}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={resetToDefault}>
            恢复默认
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存设置
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, MessageSquare, Bookmark, Search, Loader2, ExternalLink, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CompetitorPost {
  id: string
  title: string
  likes: number
  collects: number
  comments: number
  cover?: string
  user?: {
    id: string
    nickname: string
    avatar: string
  }
  xsec_token?: string
  raw_data?: any
}

interface CompetitorSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialKeyword?: string
  onSelectTitle: (title: string) => void
}

export function CompetitorSearchDialog({
  open,
  onOpenChange,
  initialKeyword = "",
  onSelectTitle,
}: CompetitorSearchDialogProps) {
  const [keyword, setKeyword] = useState(initialKeyword)
  const [isSearching, setIsSearching] = useState(false)
  const [isPublishing, setIsPublishing] = useState<string | null>(null)
  const [posts, setPosts] = useState<CompetitorPost[]>([])
  const { toast } = useToast()
  const router = useRouter()

  const searchCompetitors = async () => {
    if (!keyword.trim()) {
      toast({
        title: "请输入关键词",
        description: "搜索关键词不能为空",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setPosts([])

    try {
      // 直接调用代理搜索API
      const response = await fetch("/api/proxy/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
          page: 1,
          pageSize: 20,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "搜索失败")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "搜索请求失败")
      }

      setPosts(data.posts || [])

      if (data.posts?.length === 0) {
        toast({
          title: "未找到相关帖子",
          description: "尝试使用不同的关键词搜索",
        })
      }
    } catch (error) {
      console.error("搜索竞品帖子失败:", error)
      toast({
        title: "搜索失败",
        description: error instanceof Error ? error.message : "无法获取竞品帖子，请重试",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchCompetitors()
    }
  }

  // 查看帖子详情
  const viewPostDetail = (post: CompetitorPost) => {
    if (!post.id) {
      toast({
        title: "无法打开帖子",
        description: "帖子ID不存在",
        variant: "destructive",
      })
      return
    }

    // 构建URL，包含必要的参数
    let url = `https://www.xiaohongshu.com/explore/${post.id}`

    // 添加xsec_token参数（如果存在）
    if (post.xsec_token) {
      url += `?xsec_token=${post.xsec_token}`
      // 添加source参数
      url += `&xsec_source=pc_feed`
    }

    // 打开新窗口
    window.open(url, "_blank")
  }

  // 发布帖子（获取详情并跳转到创建页面）
  const publishPost = async (post: CompetitorPost) => {
    if (!post.id) {
      toast({
        title: "无法获取帖子",
        description: "帖子ID不存在",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(post.id)

    try {
      // 调用API获取帖子详情
      const response = await fetch("/api/proxy/note-detail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId: post.id,
          xsecToken: post.xsec_token,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "获取帖子详情失败")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "获取帖子详情失败")
      }

      const noteData = data.note

      // 将帖子数据保存到localStorage，以便创建页面使用
      localStorage.setItem(
        "draft_post",
        JSON.stringify({
          title: noteData.title,
          content: noteData.content,
          tags: noteData.tags,
          images: noteData.images,
          sourceId: post.id,
        }),
      )

      // 关闭对话框
      onOpenChange(false)

      // 跳转到创建页面
      router.push("/create")

      toast({
        title: "帖子已导入",
        description: "帖子内容已成功导入，您可以进行编辑",
      })
    } catch (error) {
      console.error("获取帖子详情失败:", error)
      toast({
        title: "获取失败",
        description: error instanceof Error ? error.message : "无法获取帖子详情，请重试",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>热门竞品帖子</DialogTitle>
          <DialogDescription>查看类似主题的热门帖子标题，点击可直接应用</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="输入关键词搜索..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button type="button" size="sm" onClick={searchCompetitors} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">搜索中...</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="p-3 border rounded-md hover:bg-muted transition-colors">
                    <div className="flex gap-3">
                      {post.cover && (
                        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                          <img
                            src={post.cover || "/placeholder.svg"}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p
                          className="font-medium line-clamp-2 cursor-pointer hover:text-primary"
                          onClick={() => onSelectTitle(post.title)}
                        >
                          {post.title}
                        </p>
                        {post.user && (
                          <div className="flex items-center gap-1 mt-1">
                            {post.user.avatar && (
                              <img
                                src={post.user.avatar || "/placeholder.svg"}
                                alt={post.user.nickname}
                                className="w-4 h-4 rounded-full"
                              />
                            )}
                            <span className="text-xs text-muted-foreground">{post.user.nickname}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-muted-foreground gap-3">
                            <span className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" /> {post.likes}
                            </span>
                            <span className="flex items-center">
                              <Bookmark className="w-3 h-3 mr-1" /> {post.collects}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" /> {post.comments}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => viewPostDetail(post)}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              查看
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => publishPost(post)}
                              disabled={isPublishing === post.id}
                            >
                              {isPublishing === post.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Copy className="w-3 h-3 mr-1" />
                              )}
                              发布
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  {keyword ? "未找到相关竞品帖子" : "请输入关键词搜索"}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

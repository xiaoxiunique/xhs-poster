"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PostGrid } from "@/components/post-grid"
import { Plus, UserPlus, Search as SearchIcon, Loader2, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

const PAGE_SIZE = 12

export default function UserMaterialsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const [user, setUser] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()
  const [allSourceUsers, setAllSourceUsers] = useState<any[]>([])
  const [selectedSourceUser, setSelectedSourceUser] = useState<string>("")

  // 获取用户信息
  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/accounts/${userId}`)
      if (!res.ok) throw new Error("获取用户信息失败")
      const data = await res.json()
      setUser(data)
    } catch (e) {
      setUser(null)
      toast({ title: "获取用户信息失败", description: e instanceof Error ? e.message : "网络错误", variant: "destructive" })
    }
  }

  // 查询素材
  const fetchMaterials = async (params?: { page?: number; q?: string; sourceUserNickname?: string }) => {
    setIsLoading(true)
    try {
      let url = `/api/proxy/user-posted?page=${params?.page || page}&pageSize=${PAGE_SIZE}&userId=${userId}`
      if (params?.q ?? search) url += `&q=${encodeURIComponent(params?.q ?? search)}`
      if (params?.sourceUserNickname) url += `&sourceUserNickname=${encodeURIComponent(params.sourceUserNickname)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setMaterials(data.data)
        setTotal(data.total)
      } else {
        setMaterials([])
        setTotal(0)
        toast({ title: "获取素材失败", description: data.error || "接口调用失败", variant: "destructive" })
      }
    } catch (e) {
      setMaterials([])
      setTotal(0)
      toast({ title: "获取素材失败", description: e instanceof Error ? e.message : "网络错误", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // 查询所有原小红书用户
  const fetchAllSourceUsers = async () => {
    try {
      const res = await fetch(`/api/proxy/user-posted?userId=${userId}&allSourceUsers=1`)
      const data = await res.json()
      if (data.success && Array.isArray(data.sourceUsers)) {
        setAllSourceUsers(data.sourceUsers)
      } else {
        setAllSourceUsers([])
      }
    } catch {
      setAllSourceUsers([])
    }
  }

  useEffect(() => {
    fetchUser()
    fetchMaterials({ page: 1 })
    fetchAllSourceUsers()
    setPage(1)
    // eslint-disable-next-line
  }, [userId])

  // 搜索
  const handleSearch = () => {
    setPage(1)
    fetchMaterials({ page: 1, q: search })
  }

  // 分页
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchMaterials({ page: newPage, q: search })
  }

  // 主页导入处理
  const handleUserImport = async () => {
    if (!userInput.trim()) return
    setIsImporting(true)
    try {
      const res = await fetch("/api/proxy/user-posted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput }),
      })
      const data = await res.json()
      if (!data.success) {
        toast({ title: "导入失败", description: data.error || "接口调用失败", variant: "destructive" })
      } else {
        toast({ title: "导入成功", description: `成功导入${data.imported}条，已存在${data.existed}条。` })
        fetchMaterials({ page: 1, q: search })
        setPage(1)
      }
    } catch (e) {
      toast({ title: "导入失败", description: e instanceof Error ? e.message : "网络错误", variant: "destructive" })
    } finally {
      setIsImporting(false)
      setIsUserDialogOpen(false)
      setUserInput("")
    }
  }

  // 原作者筛选
  const handleSourceUserSelect = (nickname: string) => {
    setSelectedSourceUser(nickname)
    setPage(1)
    fetchMaterials({ page: 1, sourceUserNickname: nickname })
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto py-8">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/materials")}> <ArrowLeft className="w-4 h-4" /> 返回 </Button>
          {user && <span className="font-semibold text-lg">{user.name} 的素材</span>}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsUserDialogOpen(true)} className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              通过主页导入
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              一键导入其他博主帖子
            </Button>
          </div>
          <div className="flex items-center gap-2 max-w-md mt-2 sm:mt-0">
            <Input
              placeholder="搜索素材标题/内容/标签..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={handleSearch} className="shrink-0">
              <SearchIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-2 items-center">
          <Button size="sm" variant={selectedSourceUser === "" ? "default" : "outline"} onClick={() => handleSourceUserSelect("")}>全部作者</Button>
          {allSourceUsers.map((u) => (
            <Button key={u.id + (u.nickname || '')} size="sm" variant={selectedSourceUser === u.nickname ? "default" : "outline"} onClick={() => handleSourceUserSelect(u.nickname)} className="flex items-center gap-1">
              {u.avatar && <img src={u.avatar} alt={u.nickname} className="w-5 h-5 rounded-full" />}
              <span>{u.nickname || u.id}</span>
            </Button>
          ))}
        </div>
        <div className="min-h-[300px] mt-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <PostGrid posts={materials.map((item) => ({
              id: item.id,
              title: item.title,
              content: item.content,
              images: Array.isArray(item.images) ? item.images : (item.images ? JSON.parse(item.images) : []),
              coverImage: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : undefined,
              status: "素材",
              created_at: item.created_at,
              updated_at: item.created_at,
              user_id: Number(userId),
            }))} />
          )}
        </div>
        {/* 分页 */}
        {total > PAGE_SIZE && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>上一页</Button>
            <span className="text-sm">第 {page} / {Math.ceil(total / PAGE_SIZE)} 页</span>
            <Button size="sm" variant="outline" onClick={() => handlePageChange(page + 1)} disabled={page >= Math.ceil(total / PAGE_SIZE)}>下一页</Button>
          </div>
        )}
        {/* 导入弹窗复用 */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>通过主页导入素材</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-2">
              <Input
                placeholder="输入小红书用户主页链接或ID"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                disabled={isImporting}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} disabled={isImporting}>
                取消
              </Button>
              <Button onClick={handleUserImport} disabled={!userInput.trim() || isImporting}>
                {isImporting ? "导入中..." : "导入"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
} 
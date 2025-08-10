"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CompetitorSearchDialog } from "@/components/competitor-search-dialog"
import { Plus, UserPlus, Search as SearchIcon, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { PostGrid } from "@/components/post-grid"
import { useRouter } from "next/navigation"

const PAGE_SIZE = 12

export default function MaterialsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [userInput, setUserInput] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  // 获取有素材的用户列表
  const fetchMaterialUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/proxy/user-posted?distinctUsers=1")
      const data = await res.json()
      if (data.success && Array.isArray(data.users)) {
        setAccounts(data.users)
      } else {
        setAccounts([])
      }
    } catch (e) {
      setAccounts([])
      toast({ title: "获取素材用户失败", description: e instanceof Error ? e.message : "网络错误", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // 查询素材（指定用户）
  const fetchMaterials = async (params?: { page?: number; q?: string; userId?: number }) => {
    if (!selectedAccount) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/proxy/user-posted?page=${params?.page || page}&pageSize=${PAGE_SIZE}&q=${encodeURIComponent(params?.q ?? search)}&userId=${params?.userId || selectedAccount.id}`)
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

  useEffect(() => {
    fetchMaterialUsers()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchMaterials({ page: 1, userId: selectedAccount.id })
      setPage(1)
    }
    // eslint-disable-next-line
  }, [selectedAccount])

  // 搜索
  const handleSearch = () => {
    setPage(1)
    fetchMaterials({ page: 1, q: search, userId: selectedAccount?.id })
  }

  // 分页
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchMaterials({ page: newPage, q: search, userId: selectedAccount?.id })
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
        if (selectedAccount) fetchMaterials({ page: 1, q: search, userId: selectedAccount.id })
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

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">素材用户</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="text-muted-foreground text-center py-12 border rounded-lg bg-muted/50 col-span-full">
              加载中...
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-muted-foreground text-center py-12 border rounded-lg bg-muted/50 col-span-full">
              暂无素材用户。
            </div>
          ) : (
            accounts.map((user) => (
              <div key={user.id} className="border rounded-lg bg-white shadow-sm p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-md transition"
                onClick={() => router.push(`/materials/${user.id}`)}>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-lg font-bold text-red-500">
                  {user.name?.slice(0, 1) || "U"}
                </div>
                <div className="font-semibold text-base">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.status === "active" ? "活跃" : "未激活"}</div>
                <div className="text-xs text-muted-foreground">素材数：{user.materialCount || 0}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
} 
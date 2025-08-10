"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Plus, Trash2, Check, Loader2, Copy, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AppLayout } from "@/components/app-layout"
import { verifyXhsCookie } from "@/lib/api-service"

interface Account {
  id: number
  name: string
  status: "active" | "expired" | "unknown"
  lastChecked: string
  createdAt: string
}

export default function AccountsPage() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [cookieValue, setCookieValue] = useState("")
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState<number | null>(null)
  const [isCheckingAccount, setIsCheckingAccount] = useState<number | null>(null)
  const [settingsAccountId, setSettingsAccountId] = useState<number | null>(null)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isDeletingAllPosts, setIsDeletingAllPosts] = useState(false)

  // 加载账号列表
  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/accounts")
      if (!response.ok) {
        throw new Error("获取账号列表失败")
      }
      const data = await response.json()
      setAccounts(data.accounts)
    } catch (error) {
      console.error("获取账号列表失败:", error)
      toast({
        title: "获取账号失败",
        description: "无法获取账号列表，请重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addAccount = async () => {
    if (!newAccountName.trim()) {
      toast({
        title: "账号名称不能为空",
        description: "请输入账号名称",
        variant: "destructive",
      })
      return
    }

    if (!cookieValue.trim()) {
      toast({
        title: "Cookie不能为空",
        description: "请输入Cookie值",
        variant: "destructive",
      })
      return
    }

    setIsAddingAccount(true)
    try {
      // 首先验证cookie是否有效
      const userInfo = await verifyXhsCookie(cookieValue)

      if (!userInfo) {
        toast({
          title: "Cookie无效",
          description: "提供的Cookie无效或已过期，请重新获取",
          variant: "destructive",
        })
        setIsAddingAccount(false)
        return
      }

      // Cookie有效，继续添加账号
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newAccountName,
          cookie: cookieValue,
          // 不再传递这些字段，因为表中没有对应的列
          // user_id: userInfo.user_id,
          // nickname: userInfo.nickname,
          // avatar: userInfo.avatar
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "添加账号失败")
      }

      await fetchAccounts()
      setIsAddDialogOpen(false)
      setNewAccountName("")
      setCookieValue("")
      toast({
        title: "添加成功",
        description: `小红书账号已成功添加`,
      })
    } catch (error) {
      console.error("添加账号失败:", error)
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加账号失败，请重试",
        variant: "destructive",
      })
    } finally {
      setIsAddingAccount(false)
    }
  }

  const deleteAccount = async (id: number) => {
    setIsDeletingAccount(id)
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("删除账号失败")
      }

      await fetchAccounts()
      toast({
        title: "删除成功",
        description: "小红书账号已成功删除",
      })
    } catch (error) {
      console.error("删除账号失败:", error)
      toast({
        title: "删除失败",
        description: "删除账号失败，请重试",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAccount(null)
    }
  }

  const checkAccountStatus = async (id: number) => {
    setIsCheckingAccount(id)
    try {
      const response = await fetch(`/api/accounts/${id}/check`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("检查账号状态失败")
      }

      const data = await response.json()

      // 更新账号列表中的状态
      setAccounts(
        accounts.map((account) =>
          account.id === id ? { ...account, status: data.status, lastChecked: new Date().toISOString() } : account,
        ),
      )

      toast({
        title: "检查完成",
        description: `账号状态: ${data.status === "active" ? "有效" : "已过期"}`,
      })
    } catch (error) {
      console.error("检查账号状态失败:", error)
      toast({
        title: "检查失败",
        description: "检查账号状态失败，请重试",
        variant: "destructive",
      })
    } finally {
      setIsCheckingAccount(null)
    }
  }

  const setActiveAccount = async (id: number) => {
    try {
      const response = await fetch(`/api/accounts/${id}/activate`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("设置活跃账号失败")
      }

      await fetchAccounts()
      toast({
        title: "设置成功",
        description: "已成功设置活跃账号",
      })
    } catch (error) {
      console.error("设置活跃账号失败:", error)
      toast({
        title: "设置失败",
        description: "设置活跃账号失败，请重试",
        variant: "destructive",
      })
    }
  }

  const copyAccountCookie = async (id: number) => {
    try {
      const response = await fetch(`/api/accounts/${id}`)

      if (!response.ok) {
        throw new Error("获取账号Cookie失败")
      }

      const data = await response.json()

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(data.cookie || "")
        toast({
          title: "复制成功",
          description: "Cookie已复制到剪贴板",
        })
      } else {
        throw new Error("浏览器不支持剪贴板操作")
      }
    } catch (error) {
      console.error("复制Cookie失败:", error)
      toast({
        title: "复制失败",
        description: "复制Cookie失败，请重试",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const openSettingsDialog = (id: number) => {
    setSettingsAccountId(id)
    setIsSettingsDialogOpen(true)
  }

  const closeSettingsDialog = () => {
    setSettingsAccountId(null)
    setIsSettingsDialogOpen(false)
  }

  const deleteAllPosts = async () => {
    if (!settingsAccountId) return
    setIsDeletingAllPosts(true)
    try {
      // mock 后端调用
      await fetch(`/api/accounts/${settingsAccountId}/posts`, { method: "DELETE" })
      toast({
        title: "删除成功",
        description: "该账号下所有帖子已删除",
      })
      closeSettingsDialog()
    } catch (error) {
      toast({
        title: "删除失败",
        description: "删除所有帖子失败，请重试",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAllPosts(false)
    }
  }

  return (
    <AppLayout title="账号管理">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">小红书账号列表</h2>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-red-500 hover:bg-red-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加账号
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">暂无账号，请添加小红书账号</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>账号名称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>最后检查时间</TableHead>
                    <TableHead>添加时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.status === "active"
                              ? "default"
                              : account.status === "expired"
                                ? "destructive"
                                : "outline"
                          }
                          className={account.status === "active" ? "bg-green-500" : ""}
                        >
                          {account.status === "active" ? "有效" : account.status === "expired" ? "已过期" : "未知"}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.lastChecked ? formatDate(account.lastChecked) : "未检查"}</TableCell>
                      <TableCell>{formatDate(account.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyAccountCookie(account.id)}
                            title="复制Cookie"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkAccountStatus(account.id)}
                            disabled={isCheckingAccount === account.id}
                            title="检查状态"
                          >
                            {isCheckingAccount === account.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setActiveAccount(account.id)}
                            disabled={account.status === "active"}
                            title="设为活跃账号"
                            className="bg-red-500 hover:bg-red-600"
                          >
                            使用
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAccount(account.id)}
                            disabled={isDeletingAccount === account.id}
                            title="删除账号"
                          >
                            {isDeletingAccount === account.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSettingsDialog(account.id)}
                            title="设置"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="flex justify-between py-4">
            <p className="text-sm text-muted-foreground">
              共 {accounts.length} 个账号，{accounts.filter((a) => a.status === "active").length} 个有效
            </p>
            <Button variant="outline" onClick={fetchAccounts}>
              刷新列表
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 添加账号对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加小红书账号</DialogTitle>
            <DialogDescription>添加小红书账号的Cookie信息，用于自动登录</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="account-name" className="text-sm font-medium">
                账号名称
              </label>
              <Input
                id="account-name"
                placeholder="例如：主账号、测试账号"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="cookie-value" className="text-sm font-medium">
                Cookie值
              </label>
              <Textarea
                id="cookie-value"
                placeholder="粘贴从浏览器中复制的Cookie值"
                value={cookieValue}
                onChange={(e) => setCookieValue(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                提示：在小红书网页版登录后，打开开发者工具，在Application/Storage标签下找到Cookies，复制所有Cookie值
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={addAccount} disabled={isAddingAccount} className="bg-red-500 hover:bg-red-600">
              {isAddingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                "添加账号"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 账号设置 Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>账号设置</DialogTitle>
            <DialogDescription>对该账号进行批量操作</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              variant="destructive"
              onClick={deleteAllPosts}
              disabled={isDeletingAllPosts}
              className="w-full"
            >
              {isDeletingAllPosts ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在删除所有帖子...</>
              ) : (
                "删除所有帖子"
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeSettingsDialog}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

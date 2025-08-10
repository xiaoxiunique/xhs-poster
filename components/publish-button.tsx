"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2, UserCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface AccountInfo {
  id: number
  name: string
  status: string
}

interface PublishButtonProps {
  postId: number
}

export function PublishButton({ postId }: PublishButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isDialogOpen) {
      fetchAccounts()
    }
  }, [isDialogOpen])

  const fetchAccounts = async () => {
    setIsLoadingAccounts(true)
    try {
      const response = await fetch("/api/accounts")
      if (!response.ok) throw new Error("获取账号失败")
      const data = await response.json()
      setAccounts(data.accounts || [])
      setSelectedAccountId(null)
    } catch (error) {
      setAccounts([])
      setSelectedAccountId(null)
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const handleConfirmAndPublish = async () => {
    if (!selectedAccountId) {
      toast({
        title: "请选择账号",
        description: "请先选择要用于发布的账号",
        variant: "destructive",
      })
      return
    }
    setIsPublishing(true)
    try {
      // 先激活账号
      const activateRes = await fetch(`/api/accounts/${selectedAccountId}/activate`, { method: "POST" })
      if (!activateRes.ok) throw new Error("激活账号失败")
      // 再发布
      const response = await fetch(`/api/posts/${postId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selectedAccountId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "发布失败")
      }
      const data = await response.json()
      toast({
        title: "发布成功",
        description: "发布成功，请在小红书查看",
      })
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "发布失败",
        description: error instanceof Error ? error.message : "无法发布帖子，请重试",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        disabled={isPublishing}
        className="bg-red-500 hover:bg-red-600 flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        发布到小红书
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>选择发布账号</DialogTitle>
            <DialogDescription>请选择要用于发布的账号，确认后将以该账号身份发布。</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingAccounts ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />加载账号中...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center text-muted-foreground">暂无可用账号，请先在账号管理中添加账号。</div>
            ) : (
              <div className="flex flex-col gap-2">
                {accounts.map((account) => (
                  <label
                    key={account.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${selectedAccountId === account.id ? "border-red-500 bg-red-50" : "border-muted"}`}
                  >
                    <input
                      type="radio"
                      name="publish-account"
                      value={account.id}
                      checked={selectedAccountId === account.id}
                      onChange={() => setSelectedAccountId(account.id)}
                      className="accent-red-500"
                    />
                    <UserCircle className="w-5 h-5" />
                    <span className="font-medium">{account.name}</span>
                    <span className={`text-xs ml-2 ${account.status === "active" ? "text-green-500" : "text-muted-foreground"}`}>{account.status === "active" ? "当前活跃" : ""}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPublishing}>取消</Button>
            <Button
              onClick={handleConfirmAndPublish}
              disabled={isPublishing || !selectedAccountId}
              className="bg-red-500 hover:bg-red-600"
            >
              {isPublishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />发布中...</> : "确认发布"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface AccountInfo {
  id: number
  name: string
  status: string
}

export function AccountStatus() {
  const [activeAccount, setActiveAccount] = useState<AccountInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActiveAccount()
  }, [])

  const fetchActiveAccount = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/accounts/active")
      if (!response.ok) {
        throw new Error("获取活跃账号失败")
      }
      const data = await response.json()
      setActiveAccount(data.account)
    } catch (error) {
      console.error("获取活跃账号失败:", error)
      setActiveAccount(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="flex items-center gap-1">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">加载账号...</span>
      </Button>
    )
  }

  if (!activeAccount) {
    return (
      <Link href="/accounts">
        <Button variant="ghost" size="sm" className="flex items-center gap-1 text-amber-500">
          <UserCircle className="w-4 h-4" />
          <span className="text-xs">未设置账号</span>
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/accounts">
      <Button
        variant="ghost"
        size="sm"
        className={`flex items-center gap-1 ${activeAccount.status === "active" ? "text-green-500" : "text-red-500"}`}
      >
        <UserCircle className="w-4 h-4" />
        <span className="text-xs">{activeAccount.name}</span>
      </Button>
    </Link>
  )
}

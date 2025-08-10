"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch("/api/logout", {
        method: "POST",
      })
      router.push("/login")
    } catch (error) {
      console.error("登出错误:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading} className="flex items-center gap-1">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      <span className="hidden sm:inline text-xs">退出</span>
    </Button>
  )
}

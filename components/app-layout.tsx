"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { AccountStatus } from "@/components/account-status"
import { PlusCircle, Search, Home, Settings, User, ArrowLeft, FileText } from "lucide-react"

interface AppLayoutProps {
  children: ReactNode
  showBackButton?: boolean
  title?: string
}

export function AppLayout({ children, showBackButton = false, title }: AppLayoutProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            {showBackButton ? (
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">返回</span>
                </Button>
              </Link>
            ) : (
              <Link href="/" className="mr-6">
                <h1 className="text-xl font-bold text-red-500">小红书发布器</h1>
              </Link>
            )}
            {title && <h1 className="text-lg font-medium">{title}</h1>}
            {!showBackButton && (
              <div className="hidden md:flex relative rounded-full bg-gray-100 px-3 py-1.5 w-64 ml-4">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜索帖子..."
                  className="bg-transparent border-none outline-none pl-7 w-full text-sm"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <AccountStatus />
            <Link href="/create">
              <Button size="sm" className="bg-red-500 hover:bg-red-600 rounded-full flex items-center gap-1">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">发布</span>
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        {/* 侧边导航 + 主内容区 */}
        <div className="flex gap-4">
          {/* 侧边导航 - 在移动端隐藏，在桌面端显示 */}
          <div className="hidden md:block w-48 shrink-0">
            <div className="sticky top-20 space-y-2">
              <Link href="/">
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  className={`w-full justify-start ${isActive("/") ? "bg-red-500 hover:bg-red-600" : ""}`}
                  size="lg"
                >
                  <Home className="mr-2 h-5 w-5" />
                  首页
                </Button>
              </Link>
              <Link href="/accounts">
                <Button
                  variant={isActive("/accounts") ? "default" : "ghost"}
                  className={`w-full justify-start ${isActive("/accounts") ? "bg-red-500 hover:bg-red-600" : ""}`}
                  size="lg"
                >
                  <User className="mr-2 h-5 w-5" />
                  账号管理
                </Button>
              </Link>
              <Link href="/posts">
                <Button
                  variant={isActive("/posts") ? "default" : "ghost"}
                  className={`w-full justify-start ${isActive("/posts") ? "bg-red-500 hover:bg-red-600" : ""}`}
                  size="lg"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  帖子管理
                </Button>
              </Link>
              <Link href="/materials">
                <Button
                  variant={isActive("/materials") ? "default" : "ghost"}
                  className={`w-full justify-start ${isActive("/materials") ? "bg-red-500 hover:bg-red-600" : ""}`}
                  size="lg"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  素材管理
                </Button>
              </Link>
              <Link href="/settings">
                <Button
                  variant={isActive("/settings") ? "default" : "ghost"}
                  className={`w-full justify-start ${isActive("/settings") ? "bg-red-500 hover:bg-red-600" : ""}`}
                  size="lg"
                >
                  <Settings className="mr-2 h-5 w-5" />
                  设置
                </Button>
              </Link>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="flex-1">{children}</div>
        </div>
      </div>

      {/* 移动端底部导航 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 px-4 z-10">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center ${isActive("/") ? "text-red-500" : ""}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">首页</span>
          </Button>
        </Link>
        <Link href="/materials">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center ${isActive("/materials") ? "text-red-500" : ""}`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs mt-1">素材</span>
          </Button>
        </Link>
        <Link href="/create">
          <Button size="sm" className="bg-red-500 hover:bg-red-600 rounded-full">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="/accounts">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center ${isActive("/accounts") ? "text-red-500" : ""}`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">账号</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

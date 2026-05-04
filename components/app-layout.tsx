"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { AccountStatus } from "@/components/account-status"
import { PlusCircle, Search, Home, Settings, User, ArrowLeft } from "lucide-react"

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

  const navItems = [
    { href: "/", label: "首页", icon: Home },
    { href: "/accounts", label: "账号", icon: User },
    { href: "/settings", label: "设置", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 shadow-sm shadow-black/[0.03] backdrop-blur-xl supports-[backdrop-filter]:bg-white/65">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {showBackButton ? (
              <Link href="/" className="shrink-0">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">返回</span>
                </Button>
              </Link>
            ) : (
              <Link href="/" className="shrink-0">
                <h1 className="text-xl font-bold text-red-500 whitespace-nowrap">小红书发布器</h1>
              </Link>
            )}
            {title && <h1 className="truncate text-lg font-medium">{title}</h1>}
            {!showBackButton && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        className={`h-9 gap-1.5 px-3 ${
                          active ? "bg-red-500 hover:bg-red-600" : "text-gray-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  )
                })}
              </nav>
            )}
            {!showBackButton && (
              <div className="hidden lg:flex relative rounded-full bg-gray-100 px-3 py-1.5 w-56 xl:w-64">
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
        {children}
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
        <Link href="/settings">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center ${isActive("/settings") ? "text-red-500" : ""}`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">设置</span>
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

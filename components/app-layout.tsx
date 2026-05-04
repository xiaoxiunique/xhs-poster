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
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 shadow-sm shadow-black/[0.03] backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            {showBackButton ? (
              <Link href="/" className="shrink-0">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">返回</span>
                </Button>
              </Link>
            ) : (
              <Link href="/" className="shrink-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm shadow-red-500/20">
                    小
                  </span>
                  <h1 className="whitespace-nowrap text-lg font-semibold tracking-normal text-gray-950">小红书发布器</h1>
                </div>
              </Link>
            )}
            {title && <h1 className="truncate text-lg font-medium">{title}</h1>}
            {!showBackButton && (
              <nav className="hidden items-center rounded-full border border-gray-200/80 bg-gray-100/70 p-1 md:flex">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        className={`h-8 rounded-full gap-1.5 px-3 text-sm shadow-none ${
                          active
                            ? "bg-white text-red-600 hover:bg-white"
                            : "bg-transparent text-gray-600 hover:bg-white/70 hover:text-gray-950"
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
              <div className="relative hidden h-9 w-52 items-center rounded-full border border-gray-200/80 bg-white/70 px-3 lg:flex xl:w-64">
                <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索帖子..."
                  className="w-full border-none bg-transparent pl-7 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <AccountStatus />
            <Link href="/create">
              <Button size="sm" className="rounded-full bg-red-500 shadow-sm shadow-red-500/20 hover:bg-red-600 flex items-center gap-1">
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

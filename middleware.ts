import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 需要排除的路径，这些路径不需要认证
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/accounts"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否是公开路径
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path))

  // 获取认证状态
  const isAuthenticated = request.cookies.has("auth")

  // 如果是登录页面且已认证，重定向到首页
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 如果不是公开路径且未认证，重定向到登录页面
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

// 配置中间件应用的路径
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

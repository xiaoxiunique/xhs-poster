import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// 从环境变量获取密码，如果未设置则使用默认密码
const SITE_PASSWORD = process.env.SITE_PASSWORD || "xiaohongshu123"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // 验证密码
    if (password !== SITE_PASSWORD) {
      return NextResponse.json({ success: false, message: "密码错误" }, { status: 401 })
    }

    // 设置认证 cookie，有效期 7 天
    const cookieStore = cookies()
    cookieStore.set({
      name: "auth",
      value: "true",
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 天
      sameSite: "strict",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("认证错误:", error)
    return NextResponse.json({ success: false, message: "认证过程中发生错误" }, { status: 500 })
  }
}

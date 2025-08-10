import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // 删除认证 cookie
    const cookieStore = cookies()
    cookieStore.delete("auth")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("登出错误:", error)
    return NextResponse.json({ success: false, message: "登出过程中发生错误" }, { status: 500 })
  }
}

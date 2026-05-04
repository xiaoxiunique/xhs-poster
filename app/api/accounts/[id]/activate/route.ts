import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { activateAccount, getAccount } from "@/lib/host-storage"

// 设置活跃账号
export async function POST(request: Request, context: any) {
  try {
    const params = await context.params
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的账号ID" }, { status: 400 })
    }

    const account = await getAccount(id)

    // 设置当前活跃账号
    const cookieStore = await cookies()
    cookieStore.set({
      name: "xhs_active_account",
      value: account.id.toString(),
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30天
    })

    await activateAccount(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("设置活跃账号失败:", error)
    return NextResponse.json({ error: "设置活跃账号失败" }, { status: 500 })
  }
}

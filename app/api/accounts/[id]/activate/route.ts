import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

// 设置活跃账号
export async function POST(request: Request, context: any) {
  try {
    const params = await context.params
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的账号ID" }, { status: 400 })
    }

    // 获取账号信息
    const accounts = await db.query(
      `
      SELECT id, name, cookie
      FROM xhs_accounts
      WHERE id = $1
    `,
      [id],
    )

    if (accounts.length === 0) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 })
    }

    const account = accounts[0]

    // 设置当前活跃账号
    const cookieStore = await cookies()
    cookieStore.set({
      name: "xhs_active_account",
      value: account.id.toString(),
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30天
    })

    // 更新所有账号状态
    await db.query(
      `
      UPDATE xhs_accounts
      SET status = CASE WHEN id = $1 THEN 'active' ELSE status END
      WHERE id = $1 OR status = 'active'
    `,
      [id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("设置活跃账号失败:", error)
    return NextResponse.json({ error: "设置活跃账号失败" }, { status: 500 })
  }
}

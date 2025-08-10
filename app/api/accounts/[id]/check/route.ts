import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// 检查账号状态
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
      SELECT id, cookie
      FROM xhs_accounts
      WHERE id = $1
    `,
      [id],
    )

    if (accounts.length === 0) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 })
    }

    const account = accounts[0]

    // 这里应该是实际检查Cookie是否有效的逻辑
    // 例如，使用Cookie发送请求到小红书API，检查响应状态
    // 现在使用模拟逻辑
    const isValid = account.cookie.length > 50 // 简单模拟，实际应该检查Cookie是否过期

    // 更新账号状态
    const status = isValid ? "active" : "expired"
    await db.query(
      `
      UPDATE xhs_accounts
      SET status = $1, last_checked = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [status, id],
    )

    return NextResponse.json({ status })
  } catch (error) {
    console.error("检查账号状态失败:", error)
    return NextResponse.json({ error: "检查账号状态失败" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// 获取所有账号
export async function GET() {
  try {
    const accounts = await db.query(`
      SELECT id, name, status, last_checked as "lastChecked", created_at as "createdAt"
      FROM xhs_accounts
      ORDER BY created_at DESC
    `)

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("获取账号列表失败:", error)
    return NextResponse.json({ error: "获取账号列表失败" }, { status: 500 })
  }
}

// 添加新账号
export async function POST(request: Request) {
  try {
    const { name, cookie, user_id, nickname, avatar } = await request.json()

    if (!name || !cookie) {
      return NextResponse.json({ error: "账号名称和Cookie不能为空" }, { status: 400 })
    }

    // 检查账号名称是否已存在
    const existingAccount = await db.query(
      `
      SELECT id FROM xhs_accounts WHERE name = $1
    `,
      [name],
    )

    if (existingAccount.length > 0) {
      return NextResponse.json({ error: "账号名称已存在" }, { status: 400 })
    }

    // 添加新账号，只使用现有的列
    const result = await db.query(
      `
      INSERT INTO xhs_accounts (name, cookie, status)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
      [name, cookie, "active"],
    )

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("添加账号失败:", error)
    return NextResponse.json({ error: "添加账号失败" }, { status: 500 })
  }
}

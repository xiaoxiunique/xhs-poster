import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// 获取单个账号信息
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的账号ID" }, { status: 400 })
    }

    const accounts = await db.query(
      `
      SELECT id, name, cookie, status, last_checked as "lastChecked", created_at as "createdAt"
      FROM xhs_accounts
      WHERE id = $1
    `,
      [id],
    )

    if (accounts.length === 0) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 })
    }

    return NextResponse.json(accounts[0])
  } catch (error) {
    console.error("获取账号信息失败:", error)
    return NextResponse.json({ error: "获取账号信息失败" }, { status: 500 })
  }
}

// 删除账号
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的账号ID" }, { status: 400 })
    }

    await db.query(
      `
      DELETE FROM xhs_accounts
      WHERE id = $1
    `,
      [id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除账号失败:", error)
    return NextResponse.json({ error: "删除账号失败" }, { status: 500 })
  }
}

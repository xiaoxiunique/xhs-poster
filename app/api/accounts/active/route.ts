import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const activeAccountId = cookieStore.get("xhs_active_account")?.value

    if (!activeAccountId) {
      return NextResponse.json({ account: null })
    }

    const accounts = await db.query(
      `
      SELECT id, name, status
      FROM xhs_accounts
      WHERE id = $1
    `,
      [Number.parseInt(activeAccountId)],
    )

    if (accounts.length === 0) {
      return NextResponse.json({ account: null })
    }

    return NextResponse.json({ account: accounts[0] })
  } catch (error) {
    console.error("获取活跃账号失败:", error)
    return NextResponse.json({ error: "获取活跃账号失败" }, { status: 500 })
  }
}

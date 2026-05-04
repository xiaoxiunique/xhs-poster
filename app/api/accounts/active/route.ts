import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getActiveAccount } from "@/lib/host-storage"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const activeAccountId = cookieStore.get("xhs_active_account")?.value

    if (!activeAccountId) return NextResponse.json({ account: null })
    return NextResponse.json(await getActiveAccount(Number.parseInt(activeAccountId)))
  } catch (error) {
    console.error("获取活跃账号失败:", error)
    return NextResponse.json({ error: "获取活跃账号失败" }, { status: 500 })
  }
}

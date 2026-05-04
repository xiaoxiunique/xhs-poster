import { NextResponse } from "next/server"
import { checkAccount } from "@/lib/host-storage"

// 检查账号状态
export async function POST(request: Request, context: any) {
  try {
    const params = await context.params
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的账号ID" }, { status: 400 })
    }

    return NextResponse.json(await checkAccount(id))
  } catch (error) {
    console.error("检查账号状态失败:", error)
    return NextResponse.json({ error: "检查账号状态失败" }, { status: 500 })
  }
}

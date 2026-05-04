import { NextResponse } from "next/server"
import { createAccount, listAccounts } from "@/lib/host-storage"

// 获取所有账号
export async function GET() {
  try {
    return NextResponse.json(await listAccounts())
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

    const result = await createAccount({ name, cookie, user_id, nickname, avatar })
    return NextResponse.json(result)
  } catch (error) {
    console.error("添加账号失败:", error)
    return NextResponse.json({ error: "添加账号失败" }, { status: 500 })
  }
}

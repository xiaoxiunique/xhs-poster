import { NextResponse } from "next/server"
import { deleteAccount, getAccount } from "@/lib/host-storage"

// 获取单个账号信息
export async function GET(request: Request, context: any) {
  try {
    const params = await context.params
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的账号ID" }, { status: 400 })
    }

    return NextResponse.json(await getAccount(id))
  } catch (error) {
    console.error("获取账号信息失败:", error)
    return NextResponse.json({ error: "获取账号信息失败" }, { status: 500 })
  }
}

// 删除账号
export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的账号ID" }, { status: 400 })
    }

    await deleteAccount(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除账号失败:", error)
    return NextResponse.json({ error: "删除账号失败" }, { status: 500 })
  }
}

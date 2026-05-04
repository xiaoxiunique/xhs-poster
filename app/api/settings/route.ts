import { NextResponse } from "next/server"
import { getSettings, saveSettings } from "@/lib/host-storage"

export async function POST(request: Request) {
  try {
    const { titlePrompt, contentPrompt, commonTags, materialCategories } = await request.json()
    await saveSettings({
      titlePrompt,
      contentPrompt,
      commonTags: commonTags || [],
      materialCategories: materialCategories || [],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("保存设置失败:", error)
    return NextResponse.json({ error: "保存设置失败" }, { status: 500 })
  }
}

export async function GET() {
  try {
    return NextResponse.json(await getSettings())
  } catch (error) {
    console.error("获取设置失败:", error)
    return NextResponse.json({ error: "获取设置失败" }, { status: 500 })
  }
}

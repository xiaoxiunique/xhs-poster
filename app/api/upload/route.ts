import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "文件不存在" }, { status: 400 })
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "只允许上传图片文件" }, { status: 400 })
    }

    // 生成唯一文件名
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`

    // 上传到Blob存储
    const blob = await put(fileName, file, {
      access: "public",
      contentType: file.type,
    })

    return NextResponse.json({
      url: blob.url,
      success: true,
    })
  } catch (error) {
    console.error("图片上传失败:", error)
    return NextResponse.json({ error: "图片上传失败", details: error }, { status: 500 })
  }
}

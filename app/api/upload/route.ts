import { NextResponse } from "next/server"
import { uploadImageToHost } from "@/lib/host-storage"

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

    const result = await uploadImageToHost(file)
    return NextResponse.json(result)
  } catch (error) {
    console.error("图片上传失败:", error)
    return NextResponse.json({ error: "图片上传失败", details: error }, { status: 500 })
  }
}

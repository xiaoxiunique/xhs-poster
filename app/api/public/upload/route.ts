import { NextResponse } from "next/server"
import { uploadImageToHost } from "@/lib/host-storage"
import { isPublicApiAuthorized } from "@/lib/public-api-auth"

export async function POST(request: Request): Promise<NextResponse> {
  if (!isPublicApiAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "file is required" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "only image files are allowed" }, { status: 400 })
    }

    const result = await uploadImageToHost(file)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "image upload failed" },
      { status: 500 },
    )
  }
}

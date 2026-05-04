import { NextResponse } from "next/server"
import { getPostFromHost } from "@/lib/host-storage"
import { isPublicApiAuthorized } from "@/lib/public-api-auth"

export async function GET(request: Request, context: any) {
  if (!isPublicApiAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const params = await context.params
    const id = Number.parseInt(params.id, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "invalid post id" }, { status: 400 })
    }

    const result = await getPostFromHost(id)
    return NextResponse.json({ success: true, post: result.post })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "failed to query post" },
      { status: 500 },
    )
  }
}

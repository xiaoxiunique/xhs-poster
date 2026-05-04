import { NextResponse } from "next/server"
import { isPublicApiAuthorized } from "@/lib/public-api-auth"

export async function GET(request: Request) {
  if (!isPublicApiAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ success: true, service: "xhs-poster-public-api" })
}

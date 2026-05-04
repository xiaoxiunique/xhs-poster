import { NextResponse } from "next/server"

function getPublicApiToken(): string | null {
  return process.env.PUBLIC_API_TOKEN || process.env.XHS_POSTER_PUBLIC_API_TOKEN || null
}

function isAuthorized(request: Request): boolean {
  const token = getPublicApiToken()
  if (!token) return false
  const auth = request.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null
  return bearer === token
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ success: true, service: "xhs-poster-public-api" })
}

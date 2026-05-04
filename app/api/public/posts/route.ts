import { NextResponse } from "next/server"
import { savePostToHost } from "@/lib/host-storage"
import { isPublicApiAuthorized } from "@/lib/public-api-auth"

type PublicPostInput = {
  title?: unknown
  content?: unknown
  tags?: unknown
  images?: unknown
  status?: unknown
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : []
}

function normalizePost(input: PublicPostInput) {
  const title = typeof input.title === "string" ? input.title.trim() : ""
  const content = typeof input.content === "string" ? input.content.trim() : ""
  const status = input.status === "published" ? "published" : "draft"
  const tags = stringArray(input.tags)
  const images = stringArray(input.images).filter((url) => /^https?:\/\//i.test(url))

  if (!title) throw new Error("title is required")
  if (!content) throw new Error("content is required")

  return { title, content, status, tags, images }
}

export async function POST(request: Request) {
  if (!isPublicApiAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const inputs = Array.isArray(body?.posts) ? body.posts : [body]
    if (inputs.length === 0) {
      return NextResponse.json({ success: false, error: "posts cannot be empty" }, { status: 400 })
    }
    if (inputs.length > 20) {
      return NextResponse.json({ success: false, error: "maximum 20 posts per request" }, { status: 400 })
    }

    const created = []
    const failed = []

    for (let index = 0; index < inputs.length; index++) {
      try {
        const post = normalizePost(inputs[index])
        const result = await savePostToHost(post)
        created.push({ index, postId: result.postId })
      } catch (error) {
        failed.push({ index, error: error instanceof Error ? error.message : "unknown error" })
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      created,
      failed,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "invalid request" },
      { status: 400 },
    )
  }
}

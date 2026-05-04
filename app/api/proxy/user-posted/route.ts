import { NextResponse } from "next/server"
import XhsPoster from "@/lib/xhs"
import { getActiveXhsAccount } from "@/lib/active-account"
import { listMaterials, saveMaterialsBulk } from "@/lib/host-storage"

function extractUserId(input: string): string | null {
  if (!input) return null
  const match = input.match(/user\/profile\/([a-zA-Z0-9]+)/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9]+$/.test(input)) return input
  return null
}

export async function POST(request: Request) {
  try {
    const { userInput } = await request.json()
    const userId = extractUserId(userInput)
    if (!userId) {
      return NextResponse.json({ success: false, error: "无效的用户主页链接或ID" }, { status: 400 })
    }

    const activeAccount = await getActiveXhsAccount()
    if (!activeAccount?.cookie) {
      return NextResponse.json({ success: false, error: "没有活跃的小红书账号，请先添加并激活账号" }, { status: 403 })
    }

    const xhs = new XhsPoster(activeAccount.cookie)
    let allNotes: any[] = []
    let page = 0
    let hasMore = true
    while (hasMore && page < 10) {
      const res = await xhs.user_posted(userId, page)
      const notes = res.data?.notes || []
      allNotes = allNotes.concat(notes)
      hasMore = notes.length > 0 && notes.length >= 30
      page++
    }

    const items = []
    for (const note of allNotes) {
      const noteId = note.note_id
      const nodeDetail = await xhs.post_detail(noteId, note.xsec_token, "pc_note")
      const item = nodeDetail.data.items[0]?.note_card
      if (!item) continue
      items.push({
        note_id: noteId,
        title: item.title || "",
        content: item.desc || "",
        images: item.image_list?.map((img: any) => img.url_default) || [],
        tags: item.tag_list || [],
        source_user: {
          id: item.user?.user_id || "",
          nickname: item.user?.nickname || "",
          avatar: item.user?.avatar || "",
        },
        likes: item.interact_info?.liked_count || 0,
        collects: item.interact_info?.collected_count || 0,
        comments: item.interact_info?.comment_count || 0,
      })
    }

    const result = await saveMaterialsBulk({ accountId: activeAccount.id, items })
    return NextResponse.json(result)
  } catch (error) {
    console.error("获取用户主页帖子失败:", error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "处理请求时出错" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.toString()
    const payload = await listMaterials(query)
    return NextResponse.json(payload)
  } catch (error) {
    console.error("查询素材失败:", error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "处理请求时出错" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { noteId, xsecToken } = await request.json()

    if (!noteId) {
      return NextResponse.json({ success: false, error: "帖子ID不能为空" }, { status: 400 })
    }

    // 获取活跃账号的cookie
    const activeAccounts = await db.query(`
      SELECT id, cookie FROM xhs_accounts WHERE status = 'active' LIMIT 1
    `)

    if (activeAccounts.length === 0) {
      return NextResponse.json({ success: false, error: "没有活跃的小红书账号，请先添加并激活账号" }, { status: 403 })
    }

    const cookie = activeAccounts[0].cookie

    // 构建请求头
    const headers = new Headers({
      Cookie: cookie,
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      Origin: "https://www.xiaohongshu.com",
      Referer: `https://www.xiaohongshu.com/explore/${noteId}`,
    })

    // 构建URL，包含必要的参数
    const url = `https://edith.xiaohongshu.com/api/sns/web/v1/feed`

    // 构建请求体
    const requestBody = {
      source_note_id: noteId,
      image_formats: ["jpg", "webp", "avif"],
    }

    // 如果有xsecToken，添加到请求体中
    if (xsecToken) {
      requestBody.xsec_token = xsecToken
    }

    // 调用小红书API获取帖子详情
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`获取帖子详情失败: ${response.status}`)
    }

    const data = await response.json()

    // 检查API响应是否成功
    if (!data.success || data.code !== 0) {
      throw new Error(`API返回错误: ${data.msg || "未知错误"}`)
    }

    // 提取帖子详情
    const noteData = data.data.items[0]?.note

    if (!noteData) {
      throw new Error("未找到帖子详情")
    }

    // 格式化返回结果
    const formattedNote = {
      id: noteData.id,
      title: noteData.title || noteData.display_title || "",
      content: noteData.desc || "",
      images: noteData.images?.map((img) => img.url) || [],
      tags: noteData.tag_list?.map((tag) => tag.name) || [],
      user: {
        id: noteData.user?.user_id || "",
        nickname: noteData.user?.nickname || "",
        avatar: noteData.user?.avatar || "",
      },
      likes: noteData.interact_info?.liked_count || 0,
      collects: noteData.interact_info?.collected_count || 0,
      comments: noteData.interact_info?.comment_count || 0,
    }

    return NextResponse.json({
      success: true,
      note: formattedNote,
    })
  } catch (error) {
    console.error("获取帖子详情失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "处理请求时出错",
      },
      { status: 500 },
    )
  }
}

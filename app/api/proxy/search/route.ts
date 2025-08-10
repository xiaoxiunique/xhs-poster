import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSearchId } from "@/lib/search-utils"

export async function POST(request: Request) {
  try {
    const { keyword, page = 1, pageSize = 20 } = await request.json()

    if (!keyword) {
      return NextResponse.json({ success: false, error: "关键词不能为空" }, { status: 400 })
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
      Referer: "https://www.xiaohongshu.com/search_result?keyword=" + encodeURIComponent(keyword),
    })

    // 生成search_id
    const searchId = getSearchId()

    // 构建请求体
    const requestBody = {
      keyword: keyword,
      page: page,
      page_size: pageSize,
      sort: "general",
      note_type: 0,
      cursor: "",
      search_id: searchId,
    }

    // 调用小红书搜索API - 使用POST方法
    const response = await fetch("https://edith.xiaohongshu.com/api/sns/web/v1/search/notes", {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`搜索API请求失败: ${response.status}`)
    }

    const data = await response.json()

    // 检查API响应是否成功
    if (!data.success || data.code !== 0) {
      throw new Error(`搜索API返回错误: ${data.msg || "未知错误"}`)
    }

    // 格式化返回结果
    const formattedResults = data.data.items
      .filter((item) => item.model_type === "note")
      .map((item: any) => {
        // 尝试从不同位置获取xsec_token
        const xsecToken = item.note_card?.xsec_token || item.xsec_token || item.note_card?.share_info?.xsec_token || ""

        return {
          id: item.id,
          title: item.note_card.display_title || item.note_card.title || "",
          likes: item.note_card.interact_info?.liked_count || 0,
          collects: item.note_card.interact_info?.collected_count || 0,
          comments: item.note_card.interact_info?.comment_count || 0,
          user: {
            id: item.note_card.user?.user_id || "",
            nickname: item.note_card.user?.nickname || "",
            avatar: item.note_card.user?.avatar || "",
          },
          cover: item.note_card.cover?.url || "",
          type: item.note_card.type,
          time: item.note_card.time,
          xsec_token: xsecToken,
          // 保存原始数据，以便调试
          raw_data: process.env.NODE_ENV === "development" ? item : undefined,
        }
      })

    return NextResponse.json({
      success: true,
      posts: formattedResults,
      total: data.data.has_more ? page * pageSize + 1 : formattedResults.length,
      keyword,
    })
  } catch (error) {
    console.error("搜索竞品帖子失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "处理请求时出错",
      },
      { status: 500 },
    )
  }
}

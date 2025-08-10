import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { keyword, limit = 10 } = await request.json()

    if (!keyword) {
      return NextResponse.json({ error: "关键词不能为空" }, { status: 400 })
    }

    // 检查是否有活跃账号
    const activeAccount = await db.query(`
      SELECT id, cookie FROM xhs_accounts WHERE status = 'active' LIMIT 1
    `)

    if (activeAccount.length === 0) {
      return NextResponse.json({ error: "没有活跃的小红书账号，请先添加并激活账号" }, { status: 403 })
    }

    // 调用我们的代理搜索API
    const response = await fetch(`${request.headers.get("origin")}/api/proxy/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keyword,
        page: 1,
        pageSize: limit,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "搜索请求失败")
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "搜索请求失败")
    }

    // 转换为前端需要的格式
    const formattedPosts = data.posts.map((post: any) => ({
      title: post.title,
      likes: post.likes,
      collects: post.collects,
      comments: post.comments,
      id: post.id,
      cover: post.cover,
      user: post.user,
      tags: [], // 小红书API不直接返回标签，可以从标题中提取或使用其他方法
    }))

    return NextResponse.json({
      posts: formattedPosts,
      total: data.total,
      keyword,
    })
  } catch (error) {
    console.error("搜索竞品帖子失败:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "处理请求时出错" }, { status: 500 })
  }
}

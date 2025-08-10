import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { cookie } = await request.json()

    if (!cookie) {
      return NextResponse.json({ error: "Cookie不能为空" }, { status: 400 })
    }

    // 构建请求头，包含必要的cookie和其他头部
    const headers = new Headers({
      Cookie: cookie,
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    })

    // 调用小红书用户信息API
    const response = await fetch("https://edith.xiaohongshu.com/api/sns/web/v2/user/me", {
      method: "GET",
      headers,
    })

    const data = await response.json()

    // 直接返回小红书API的响应
    return NextResponse.json(data)
  } catch (error) {
    console.error("获取用户信息失败:", error)
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 })
  }
}

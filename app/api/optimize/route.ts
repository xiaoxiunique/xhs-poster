import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// OpenRouter API配置
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

export async function POST(request: Request) {
  try {
    const { text, type } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "文本内容不能为空" }, { status: 400 })
    }

    // 获取用户设置的system prompt
    const cookieStore = cookies()
    let systemPrompt = ""

    if (type === "title") {
      const titlePrompt = cookieStore.get("titleSystemPrompt")?.value
      systemPrompt = titlePrompt || "请将小红书标题优化得更吸引人、更有点击率，同时保持原意，不超过20个字。"
    } else if (type === "content") {
      const contentPrompt = cookieStore.get("contentSystemPrompt")?.value
      systemPrompt = contentPrompt || "请将小红书正文内容优化，使其更生动、更有吸引力，同时保持原意，不超过1000个字。"
    } else {
      return NextResponse.json({ error: "无效的优化类型" }, { status: 400 })
    }

    // 构建用户提示词
    const userPrompt = `${text}`

    // 调用OpenRouter API
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://vercel.app",
        "X-Title": "XHS Publisher",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku", // 可以根据需要选择不同的模型
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("OpenRouter API错误:", error)
      return NextResponse.json({ error: "AI优化失败，请重试" }, { status: response.status })
    }

    const data = await response.json()
    const optimizedText = data.choices[0].message.content.trim()

    return NextResponse.json({ optimizedText })
  } catch (error) {
    console.error("优化内容时出错:", error)
    return NextResponse.json({ error: "处理请求时出错" }, { status: 500 })
  }
}

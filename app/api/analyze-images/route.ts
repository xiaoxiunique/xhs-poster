import { NextResponse } from "next/server"

// OpenRouter API配置
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

export async function POST(request: Request) {
  try {
    const { images } = await request.json()

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "没有提供图片" }, { status: 400 })
    }

    // 最多分析前5张图片，避免提示词过长
    const imagesToAnalyze = images.slice(0, 5)

    // 构建图片描述提示词
    let imagePrompt = "以下是一组图片的URL，请分析这些图片并生成适合小红书平台的标题和内容：\n\n"

    imagesToAnalyze.forEach((imageUrl: string, index: number) => {
      imagePrompt += `图片${index + 1}: ${imageUrl}\n`
    })

    imagePrompt +=
      "\n请根据这些图片的内容，生成：\n1. 一个吸引人的小红书标题（不超过20字）\n2. 详细的正文内容（不超过1000字），描述图片中的内容，使用生动有趣的语言，适当添加emoji表情\n\n请以JSON格式返回，包含title和content两个字段。"

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
            content:
              "你是一个专业的小红书内容创作助手，擅长分析图片并创作吸引人的标题和内容。请使用生动活泼的语言，适当添加emoji表情，符合小红书平台的风格。",
          },
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("OpenRouter API错误:", error)
      return NextResponse.json({ error: "AI分析图片失败，请重试" }, { status: response.status })
    }

    const data = await response.json()
    let result

    try {
      // 尝试解析JSON响应
      const content = data.choices[0].message.content
      result = JSON.parse(content)
    } catch (e) {
      // 如果解析失败，尝试从文本中提取标题和内容
      const content = data.choices[0].message.content

      // 简单的提取逻辑
      const titleMatch = content.match(/标题[：:]\s*(.+?)(?:\n|$)/)
      const contentMatch = content.match(/内容[：:]\s*([\s\S]+)/)

      result = {
        title: titleMatch ? titleMatch[1].trim() : "",
        content: contentMatch ? contentMatch[1].trim() : content,
      }
    }

    // 确保标题不超过20个字
    if (result.title && result.title.length > 20) {
      result.title = result.title.substring(0, 20)
    }

    // 确保内容不超过1000个字
    if (result.content && result.content.length > 1000) {
      result.content = result.content.substring(0, 1000)
    }

    return NextResponse.json({
      title: result.title,
      content: result.content,
    })
  } catch (error) {
    console.error("分析图片时出错:", error)
    return NextResponse.json({ error: "处理请求时出错" }, { status: 500 })
  }
}

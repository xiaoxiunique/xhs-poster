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

    // 最多处理前5张图片，避免提示词过长
    const imagesToProcess = images.slice(0, 5)

    // 构建OCR提示词
    let ocrPrompt = "请从以下图片中提取所有可见的文本内容。只需返回提取的文本，不需要任何解释或分析：\n\n"

    imagesToProcess.forEach((imageUrl: string, index: number) => {
      ocrPrompt += `图片${index + 1}: ${imageUrl}\n`
    })

    ocrPrompt +=
      "\n请仅返回图片中的文本内容，按照图片中的原始格式和布局尽量保留。如果有多张图片，请分别标明每张图片提取的文本。如果图片中没有文本，请说明'图片中未检测到文本'。"

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
              "你是一个专业的OCR文本提取助手，你的任务是从图片中提取所有可见的文本内容。请只返回提取的文本，不要添加任何解释或分析。",
          },
          {
            role: "user",
            content: ocrPrompt,
          },
        ],
        temperature: 0.3, // 使用较低的温度以获得更准确的OCR结果
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("OpenRouter API错误:", error)
      return NextResponse.json({ error: "提取文本失败，请重试" }, { status: response.status })
    }

    const data = await response.json()
    const extractedText = data.choices[0].message.content.trim()

    // 检查是否提取到文本
    if (extractedText.includes("未检测到文本") && !extractedText.includes("图片")) {
      return NextResponse.json({ extractedText: "" })
    }

    return NextResponse.json({ extractedText })
  } catch (error) {
    console.error("提取文本时出错:", error)
    return NextResponse.json({ error: "处理请求时出错" }, { status: 500 })
  }
}

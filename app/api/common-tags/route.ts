import { NextResponse } from "next/server"
import { getCommonTags } from "@/lib/host-storage"

// Topic 接口定义
interface Topic {
  name: string;
  link: string;
  view_num: number;
  type: string;
  smart: boolean;
  id: string;
}

export async function GET() {
  try {
    const { tags } = await getCommonTags()
    // 确保返回的是完整的 Topic 对象
    const commonTags = (tags || []) as Array<string | Topic>
    
    // 兼容处理：如果保存的是字符串数组，则转换为默认的 Topic 对象格式
    const formattedTags = commonTags.map((tag: string | Topic) => {
      if (typeof tag === 'string') {
        return {
          name: tag,
          link: "",
          view_num: 0,
          type: "official",
          smart: false,
          id: `tag-${Math.random().toString(36).substring(2, 9)}`
        }
      }
      return tag
    })

    return NextResponse.json({ tags: formattedTags })
  } catch (error) {
    console.error("获取公共标签失败:", error)
    return NextResponse.json({ error: "获取公共标签失败" }, { status: 500 })
  }
}

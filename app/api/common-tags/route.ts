import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Topic 接口定义
interface Topic {
  name: string;
  link: string;
  view_num: number;
  type: string;
  smart: boolean;
  id: string;
}

// 确保kv表存在
async function ensureKvTable() {
  try {
    // 检查 kv 表是否存在
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'kv'
      );
    `)

    if (!tableExists[0].exists) {
      console.log("创建 kv 表...")
      
      // 创建 kv 表
      await db.query(`
        CREATE TABLE kv (
          key TEXT PRIMARY KEY,
          data JSONB NOT NULL
        );
      `)
      
      console.log("kv 表创建成功")
    }
  } catch (error) {
    console.error("确保 kv 表存在时出错:", error)
    throw error
  }
}

export async function GET() {
  try {
    // 确保表存在
    await ensureKvTable()
    
    // 从 KV 表获取设置
    const result = await db.query(`
      SELECT data FROM kv WHERE key = 'system_settings'
    `)

    if (result.length === 0) {
      return NextResponse.json({ tags: [] })
    }

    const settings = result[0].data
    // 确保返回的是完整的 Topic 对象
    const commonTags = settings.commonTags || []
    
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
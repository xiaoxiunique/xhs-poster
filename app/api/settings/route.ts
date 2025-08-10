import { NextResponse } from "next/server"
import { db } from "@/lib/db"

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

export async function POST(request: Request) {
  try {
    // 确保表存在
    await ensureKvTable()
    
    const { titlePrompt, contentPrompt, commonTags } = await request.json()

    // 将设置保存到 KV 表
    await db.query(`
      INSERT INTO kv (key, data) 
      VALUES ('system_settings', $1)
      ON CONFLICT (key) 
      DO UPDATE SET data = $1
    `, [JSON.stringify({
      titlePrompt,
      contentPrompt,
      commonTags: commonTags || []
    })])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("保存设置失败:", error)
    return NextResponse.json({ error: "保存设置失败" }, { status: 500 })
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

    const settings = result.length > 0 
      ? result[0].data 
      : {
          titlePrompt: "请将小红书标题优化得更吸引人、更有点击率，同时保持原意，不超过20个字。使用生动的形容词，增加情感色彩。",
          contentPrompt: "请将小红书正文内容优化，使其更生动、更有吸引力，同时保持原意，不超过1000个字。使用通俗易懂的语言，增加情感共鸣，适当使用emoji表情，分段清晰。",
          commonTags: []
        }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("获取设置失败:", error)
    return NextResponse.json({ error: "获取设置失败" }, { status: 500 })
  }
}

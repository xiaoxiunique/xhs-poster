import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import XhsPoster from "@/lib/xhs"

function extractUserId(input: string): string | null {
  // 支持直接输入ID或主页链接
  if (!input) return null
  // 主页链接示例：https://www.xiaohongshu.com/user/profile/xxx
  const match = input.match(/user\/profile\/([a-zA-Z0-9]+)/)
  if (match) return match[1]
  // 纯ID
  if (/^[a-zA-Z0-9]+$/.test(input)) return input
  return null
}

// 确保 materials 表存在
async function ensureMaterialsTable() {
  const tableExists = await db.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'materials'
    );
  `)
  if (!tableExists[0].exists) {
    await db.query(`
      CREATE TABLE materials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        note_id TEXT,
        title TEXT,
        content TEXT,
        images JSONB,
        tags JSONB,
        source_user JSONB,
        likes INTEGER,
        collects INTEGER,
        comments INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, note_id)
      );
    `)
  }
}

export async function POST(request: Request) {
  try {
    const { userInput } = await request.json()
    const userId = extractUserId(userInput)
    if (!userId) {
      return NextResponse.json({ success: false, error: "无效的用户主页链接或ID" }, { status: 400 })
    }

    // 确保 materials 表存在
    await ensureMaterialsTable()

    // 获取活跃账号
    const activeAccounts = await db.query(`SELECT id, cookie FROM xhs_accounts WHERE status = 'active' LIMIT 1`)
    if (activeAccounts.length === 0) {
      return NextResponse.json({ success: false, error: "没有活跃的小红书账号，请先添加并激活账号" }, { status: 403 })
    }
    const accountId = activeAccounts[0].id
    const cookie = activeAccounts[0].cookie
    const xhs = new XhsPoster(cookie)

    // 获取用户所有帖子（分页）
    let allNotes: any[] = []
    let page = 0
    let hasMore = true
    while (hasMore && page < 10) {
      const res = await xhs.user_posted(userId, page)
      const notes = res.data?.notes || []
      allNotes = allNotes.concat(notes)
      hasMore = notes.length > 0 && notes.length >= 30
      page++
    }

    // 批量写入 materials 表，避免重复
    let imported = 0
    let existed = 0
    for (const note of allNotes) {
      const noteId = note.note_id
      const nodeDetail = await xhs.post_detail(noteId, note.xsec_token, 'pc_note')
      const item = nodeDetail.data.items[0]?.note_card;

      // 检查是否已存在
      const exists = await db.query(
        `SELECT 1 FROM materials WHERE user_id = $1 AND note_id = $2 LIMIT 1`,
        [accountId, noteId]
      )
      if (exists.length > 0) {
        existed++
        continue
      }
      await db.query(
        `INSERT INTO materials (user_id, note_id, title, content, images, tags, source_user, likes, collects, comments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          accountId,
          noteId,
          item.title || "",
          item.desc || "",
          JSON.stringify(item.image_list?.map((img: any) => img.url_default) || []),
          JSON.stringify(item.tag_list),
          JSON.stringify({
            id: item.user?.user_id || "",
            nickname: item.user?.nickname || "",
            avatar: item.user?.avatar || "",
          }),
          item.interact_info?.liked_count || 0,
          item.interact_info?.collected_count || 0,
          item.interact_info?.comment_count || 0,
        ]
      )
      imported++
    }

    return NextResponse.json({ success: true, imported, existed, total: allNotes.length })
  } catch (error) {
    console.error("获取用户主页帖子失败:", error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "处理请求时出错" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const distinctUsers = searchParams.get("distinctUsers")
    if (distinctUsers === "1") {
      // 查询有素材的用户列表
      const users = await db.query(`
        SELECT m.user_id as id, a.name, a.status, COUNT(m.id) as "materialCount"
        FROM materials m
        JOIN xhs_accounts a ON m.user_id = a.id
        GROUP BY m.user_id, a.name, a.status
        ORDER BY MAX(m.created_at) DESC
      `)
      return NextResponse.json({ success: true, users })
    }
    // 获取活跃账号
    const activeAccounts = await db.query(`SELECT id FROM xhs_accounts WHERE status = 'active' LIMIT 1`)
    if (activeAccounts.length === 0) {
      return NextResponse.json({ success: false, error: "没有活跃的小红书账号，请先添加并激活账号" }, { status: 403 })
    }
    const accountId = activeAccounts[0].id

    // 解析分页和搜索参数
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10)
    const keyword = searchParams.get("q")?.trim() || ""
    const sourceUserNickname = searchParams.get("sourceUserNickname")

    // 构建查询
    let where = `WHERE user_id = $1`
    let params: any[] = [accountId]
    if (keyword) {
      where += ` AND (title ILIKE $2 OR content ILIKE $2 OR tags::text ILIKE $2)`
      params.push(`%${keyword}%`)
    }
    if (sourceUserNickname) {
      where += ` AND source_user->>'nickname' = $${params.length + 1}`
      params.push(sourceUserNickname)
    }
    const offset = (page - 1) * pageSize

    // 查询总数
    const countRes = await db.query(`SELECT COUNT(*) FROM materials ${where}`, params)
    const total = parseInt(countRes[0].count, 10)

    // 查询分页数据
    const dataRes = await db.query(
      `SELECT id, note_id, title, content, images, tags, source_user, likes, collects, comments, created_at
       FROM materials
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    )

    if (searchParams.get("allTags") === "1" && searchParams.get("userId")) {
      const userId = Number(searchParams.get("userId"))
      const tagsRes = await db.query(`SELECT tags FROM materials WHERE user_id = $1`, [userId])
      const tagSet = new Set<string>()
      for (const row of tagsRes) {
        let tags: string[] = []
        if (Array.isArray(row.tags)) tags = row.tags
        else if (typeof row.tags === "string") {
          try { tags = JSON.parse(row.tags) } catch {}
        }
        tags.forEach((t) => t && tagSet.add(t))
      }
      return NextResponse.json({ success: true, tags: Array.from(tagSet) })
    }

    if (searchParams.get("allSourceUsers") === "1" && searchParams.get("userId")) {
      const userId = Number(searchParams.get("userId"))
      const usersRes = await db.query(`SELECT source_user FROM materials WHERE user_id = $1`, [userId])
      const userMap = new Map()
      for (const row of usersRes) {
        let u = null
        if (typeof row.source_user === "object" && row.source_user !== null) u = row.source_user
        else if (typeof row.source_user === "string") {
          try { u = JSON.parse(row.source_user) } catch {}
        }
        if (u && u.id) userMap.set(u.id, u)
      }
      return NextResponse.json({ success: true, sourceUsers: Array.from(userMap.values()) })
    }

    return NextResponse.json({ success: true, total, page, pageSize, data: dataRes })
  } catch (error) {
    console.error("查询素材失败:", error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "处理请求时出错" }, { status: 500 })
  }
} 
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import XhsPoster from "@/lib/xhs";

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

// 从 KV 表获取公共标签
async function getCommonTopics() {
  try {
    // 确保表存在
    await ensureKvTable()
    
    // 从 KV 表获取设置
    const result = await db.query(`
      SELECT data FROM kv WHERE key = 'system_settings'
    `)
    
    if (result.length === 0 || !result[0].data.commonTags || result[0].data.commonTags.length === 0) {
      // 如果没有配置或为空，返回默认标签
      return getDefaultTopics();
    }
    
    return result[0].data.commonTags;
  } catch (error) {
    console.error("获取公共标签失败:", error);
    // 出错时返回默认标签
    return getDefaultTopics();
  }
}

// 默认标签（兼容原有逻辑）
function getDefaultTopics() {
  return [
    {
      type: "official",
      smart: false,
      id: "5bf54ae0e1921600011295f8",
      name: "程序员",
      link: "https://www.xiaohongshu.com/page/topics/5bf54ae0c3f6740001ee10fd?naviHidden=yes",
      view_num: 2919330080,
    },
    {
      id: "634d21c1000000000100a578",
      name: "程序员开发",
      link: "https://www.xiaohongshu.com/page/topics/634d21c11909380001237801?naviHidden=yes",
      view_num: 223243,
      type: "official",
      smart: false,
    },
    {
      type: "official",
      smart: false,
      id: "5c18f74f0000000003031c47",
      name: "每日学习",
      link: "https://www.xiaohongshu.com/page/topics/5c18f74fa88e2c0001db3f7e?naviHidden=yes",
      view_num: 111028756,
    },
    {
      link: "https://www.xiaohongshu.com/page/topics/61137a1abe0b5100013ccad1?naviHidden=yes",
      view_num: 2560380,
      type: "official",
      smart: false,
      id: "61137a1a0000000001007dd4",
      name: "10分钟",
    },
    {
      link: "https://www.xiaohongshu.com/page/topics/5c0f70b75237920001b360e6?naviHidden=yes",
      view_num: 282335740,
      type: "official",
      smart: false,
      id: "5c0f70b73767f600014af155",
      name: "软件开发",
    },
    {
      link: "https://www.xiaohongshu.com/page/topics/5cac833df6928f0001428a54?naviHidden=yes",
      view_num: 188394464,
      type: "official",
      smart: false,
      id: "5cac833d000000000f02a8d6",
      name: "小程序开发",
    },
    {
      id: "611a696f000000000100b965",
      name: "App开发",
      link: "https://www.xiaohongshu.com/page/topics/611a696f61a1e70001524c10?naviHidden=yes",
      view_num: 70650808,
      type: "official",
      smart: false,
    },
  ];
}

export async function POST(request: Request, context: any) {
  try {
    const params = await context.params
    const postId = Number.parseInt(params.id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: "无效的帖子ID" },
        { status: 400 }
      );
    }

    // 新增：解析 body 里的 accountId
    let accountId: number | null = null
    try {
      const body = await request.json()
      if (body && body.accountId) {
        accountId = Number(body.accountId)
      }
    } catch (e) {
      // body 不是 json 或没传 accountId，忽略
    }

    // 从数据库获取帖子详情
    const posts = await db.query(
      `
      SELECT 
        p.id, p.title, p.content, p.status
      FROM 
        posts p
      WHERE 
        p.id = $1
    `,
      [postId]
    );

    if (posts.length === 0) {
      return NextResponse.json(
        { success: false, error: "帖子不存在" },
        { status: 404 }
      );
    }

    const post = posts[0];

    // 获取帖子图片
    const images = await db.query(
      `
      SELECT 
        url
      FROM 
        images
      WHERE 
        post_id = $1
      ORDER BY 
        display_order ASC
    `,
      [postId]
    );

    // 获取帖子标签
    const tags = await db.query(
      `
      SELECT 
        t.name
      FROM 
        tags t
      JOIN 
        post_tags pt ON t.id = pt.tag_id
      WHERE 
        pt.post_id = $1
    `,
      [postId]
    );

    // 获取用于发布的账号 cookie
    let cookie: string | null = null
    if (accountId) {
      const accounts = await db.query(
        `SELECT id, cookie FROM xhs_accounts WHERE id = $1`,
        [accountId],
      )
      if (accounts.length === 0) {
        return NextResponse.json(
          { success: false, error: "指定账号不存在" },
          { status: 404 }
        )
      }
      cookie = accounts[0].cookie
    } else {
      const activeAccounts = await db.query(`
        SELECT id, cookie FROM xhs_accounts WHERE status = 'active' LIMIT 1
      `);
      if (activeAccounts.length === 0) {
        return NextResponse.json(
          { success: false, error: "没有活跃的小红书账号，请先添加并激活账号" },
          { status: 403 }
        );
      }
      cookie = activeAccounts[0].cookie
    }
    if (!cookie) {
      return NextResponse.json(
        { success: false, error: "账号Cookie为空，无法发布" },
        { status: 400 }
      )
    }

    // 从 KV 表获取公共标签
    const commonTopics = await getCommonTopics();

    const xhsPoster = new XhsPoster(cookie);
    const res = await xhsPoster.createImageNote(
      post.title,
      post.content,
      images.map((img) => img.url),
      null,
      [],
      commonTopics,
      false
    );
    // 模拟发布过程（这里只是返回帖子数据，实际应用中可能需要调用小红书API）
    const publishData = {
      id: post.id,
      title: post.title,
      content: post.content,
      status: "published", // 标记为已发布
      images: images.map((img) => img.url),
      tags: tags.map((tag) => tag.name),
      res,
    };

    // 在实际应用中，这里可能需要调用小红书API进行发布
    // 现在我们只是模拟发布过程，将状态更新为已发布
    await db.query(
      `
      UPDATE posts
      SET status = 'published', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [postId]
    );

    return NextResponse.json({
      success: true,
      message: "帖子已准备好发布",
      post: publishData,
    });
  } catch (error) {
    console.error("准备发布帖子失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "处理请求时出错",
      },
      { status: 500 }
    );
  }
}

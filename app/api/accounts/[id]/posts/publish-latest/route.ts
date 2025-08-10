import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import XhsPoster from "@/lib/xhs";
import { verifyXhsCookie } from "@/lib/api-service";

// 获取公共标签（复用逻辑）
async function ensureKvTable() {
  try {
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'kv'
      );
    `);
    if (!tableExists[0].exists) {
      await db.query(`
        CREATE TABLE kv (
          key TEXT PRIMARY KEY,
          data JSONB NOT NULL
        );
      `);
    }
  } catch (error) {
    throw error;
  }
}
async function getCommonTopics() {
  try {
    await ensureKvTable();
    const result = await db.query(`SELECT data FROM kv WHERE key = 'system_settings'`);
    if (result.length === 0 || !result[0].data.commonTags || result[0].data.commonTags.length === 0) {
      return getDefaultTopics();
    }
    return result[0].data.commonTags;
  } catch {
    return getDefaultTopics();
  }
}
function getDefaultTopics() {
  return [
    { type: "official", smart: false, id: "5bf54ae0e1921600011295f8", name: "程序员", link: "https://www.xiaohongshu.com/page/topics/5bf54ae0c3f6740001ee10fd?naviHidden=yes", view_num: 2919330080 },
    { id: "634d21c1000000000100a578", name: "程序员开发", link: "https://www.xiaohongshu.com/page/topics/634d21c11909380001237801?naviHidden=yes", view_num: 223243, type: "official", smart: false },
    { type: "official", smart: false, id: "5c18f74f0000000003031c47", name: "每日学习", link: "https://www.xiaohongshu.com/page/topics/5c18f74fa88e2c0001db3f7e?naviHidden=yes", view_num: 111028756 },
    { link: "https://www.xiaohongshu.com/page/topics/61137a1abe0b5100013ccad1?naviHidden=yes", view_num: 2560380, type: "official", smart: false, id: "61137a1a0000000001007dd4", name: "10分钟" },
    { link: "https://www.xiaohongshu.com/page/topics/5c0f70b75237920001b360e6?naviHidden=yes", view_num: 282335740, type: "official", smart: false, id: "5c0f70b73767f600014af155", name: "软件开发" },
    { link: "https://www.xiaohongshu.com/page/topics/5cac833df6928f0001428a54?naviHidden=yes", view_num: 188394464, type: "official", smart: false, id: "5cac833d000000000f02a8d6", name: "小程序开发" },
    { id: "611a696f000000000100b965", name: "App开发", link: "https://www.xiaohongshu.com/page/topics/611a696f61a1e70001524c10?naviHidden=yes", view_num: 70650808, type: "official", smart: false },
  ];
}

export async function POST(request: Request, context: any) {
  try {
    const params = await context.params;
    const accountId = Number.parseInt(params.id);
    if (isNaN(accountId)) {
      return NextResponse.json({ success: false, error: "无效的账号ID" }, { status: 400 });
    }
    // 获取账号信息
    const accounts = await db.query(
      `SELECT id, cookie FROM xhs_accounts WHERE id = $1`,
      [accountId]
    );
    if (accounts.length === 0) {
      return NextResponse.json({ success: false, error: "账号不存在" }, { status: 404 });
    }
    const cookie = accounts[0].cookie;
    // 检查登录状态（直接请求小红书接口）
    const headers = new Headers({
      Cookie: cookie,
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    });
    const resp = await fetch("https://edith.xiaohongshu.com/api/sns/web/v2/user/me", {
      method: "GET",
      headers,
    });
    const data = await resp.json();
    if (!data.data || !data.data.user_id) {
      return NextResponse.json({ success: false, error: "账号登录状态无效或已过期" }, { status: 401 });
    }
    // 查找该账号下最早未发布的帖子
    const posts = await db.query(
      `SELECT id, title, content, status FROM posts ORDER BY updated_at ASC LIMIT 1`
    );
    if (posts.length === 0) {
      return NextResponse.json({ success: false, error: "没有未发布的帖子" }, { status: 404 });
    }
    const post = posts[0];
    // 获取帖子图片
    const images = await db.query(
      `SELECT url FROM images WHERE post_id = $1 ORDER BY display_order ASC`,
      [post.id]
    );
    // 获取帖子标签
    const tags = await db.query(
      `SELECT t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1`,
      [post.id]
    );
    // 获取公共标签
    const commonTopics = await getCommonTopics();
    // 发布帖子
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
    // 更新帖子状态
    await db.query(
      `UPDATE posts SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [post.id]
    );
    return NextResponse.json({
      success: true,
      message: "已发布最早未发布的帖子",
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        status: "published",
        images: images.map((img) => img.url),
        tags: tags.map((tag) => tag.name),
        res,
      },
    });
  } catch (error) {
    console.error("发布最新未发布帖子失败:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "处理请求时出错" }, { status: 500 });
  }
} 
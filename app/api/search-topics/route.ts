import { NextResponse } from "next/server";
import XhsPoster from "@/lib/xhs";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json(
        { error: "关键词是必需的且必须是字符串" },
        { status: 400 }
      );
    }

    // 获取活跃账号的cookie
    const activeAccounts = await db.query(`
        SELECT id, cookie FROM xhs_accounts WHERE status = 'active' LIMIT 1
      `);

    if (activeAccounts.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有活跃的小红书账号，请先添加并激活账号" },
        { status: 403 }
      );
    }

    const cookie = activeAccounts[0].cookie;

    if (!cookie) {
      return NextResponse.json(
        { error: "无法获取小红书认证信息 (Cookie)" },
        { status: 401 } // Unauthorized
      );
    }

    const xhsPoster = new XhsPoster(cookie);
    const topics = await xhsPoster.searchTopic(keyword);

    return NextResponse.json(topics);
  } catch (error) {
    console.error("API /api/search-topics error:", error);
    return NextResponse.json(
      { error: "搜索话题时发生内部服务器错误" },
      { status: 500 }
    );
  }
}

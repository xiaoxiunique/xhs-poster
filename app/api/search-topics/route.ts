import { NextResponse } from "next/server";
import XhsPoster from "@/lib/xhs";
import { getActiveXhsAccount } from "@/lib/active-account";

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json(
        { error: "关键词是必需的且必须是字符串" },
        { status: 400 }
      );
    }

    const activeAccount = await getActiveXhsAccount();
    if (!activeAccount) {
      return NextResponse.json(
        { success: false, error: "没有活跃的小红书账号，请先添加并激活账号" },
        { status: 403 }
      );
    }

    const cookie = activeAccount.cookie;

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

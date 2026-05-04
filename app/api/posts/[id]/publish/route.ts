import { NextResponse } from "next/server"
import XhsPoster from "@/lib/xhs"
import { getActiveXhsAccount } from "@/lib/active-account"
import { getAccount, getPostFromHost, getSettings, markPostPublished } from "@/lib/host-storage"

async function getCommonTopics() {
  try {
    const settings = await getSettings()
    if (!settings.commonTags || settings.commonTags.length === 0) return getDefaultTopics()
    return settings.commonTags
  } catch (error) {
    console.error("获取公共标签失败:", error)
    return getDefaultTopics()
  }
}

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
  ]
}

export async function POST(request: Request, context: any) {
  try {
    const params = await context.params
    const postId = Number.parseInt(params.id)

    if (isNaN(postId)) {
      return NextResponse.json({ success: false, error: "无效的帖子ID" }, { status: 400 })
    }

    let accountId: number | null = null
    try {
      const body = await request.json()
      if (body?.accountId) accountId = Number(body.accountId)
    } catch {
      // Body is optional.
    }

    const { post } = await getPostFromHost(postId)
    const account = accountId ? await getAccount(accountId) : await getActiveXhsAccount()
    if (!account) {
      return NextResponse.json({ success: false, error: "没有活跃的小红书账号，请先添加并激活账号" }, { status: 403 })
    }
    if (!account.cookie) {
      return NextResponse.json({ success: false, error: "账号Cookie为空，无法发布" }, { status: 400 })
    }

    const commonTopics = await getCommonTopics()
    const xhsPoster = new XhsPoster(account.cookie)
    const res = await xhsPoster.createImageNote(
      post.title,
      post.content,
      post.images.map((img) => img.url),
      null,
      [],
      commonTopics,
      false,
    )

    await markPostPublished(postId)

    return NextResponse.json({
      success: true,
      message: "帖子已准备好发布",
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        status: "published",
        images: post.images.map((img) => img.url),
        tags: post.tags.map((tag) => tag.name),
        res,
      },
    })
  } catch (error) {
    console.error("准备发布帖子失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "处理请求时出错",
      },
      { status: 500 },
    )
  }
}

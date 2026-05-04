import { NextResponse } from "next/server";
import XhsPoster from "@/lib/xhs";
import { getAccount } from "@/lib/host-storage";

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const id = Number.parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "无效的账号ID" }, { status: 400 });
  }
  const account = await getAccount(id).catch(() => null);
  if (!account?.cookie) {
    return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  }
  const cookie = account.cookie;
  console.log("🚀 ~ DELETE ~ cookie:", cookie);

  const poster = new XhsPoster(cookie);
  const posts = await poster.posted();
  console.log("🚀 ~ DELETE ~ posts:", posts);
  for (const post of posts.data.notes) {
    await poster.delete(post.id);
  }

  // 2. 这里可以用 cookie 做后续操作（mock: 打印日志）
  console.log(`[MOCK] 删除账号${id}下所有帖子，cookie:`, cookie);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return NextResponse.json(
    { message: "已删除该账号下所有帖子" },
    { status: 200 }
  );
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - 页面未找到</h1>
      <p className="text-muted-foreground mb-8">您访问的页面不存在或已被删除</p>
      <Link href="/">
        <Button>返回首页</Button>
      </Link>
    </div>
  )
}

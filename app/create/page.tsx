import { XiaohongshuForm } from "@/components/xiaohongshu-form"
import { AppLayout } from "@/components/app-layout"

export default function CreatePage() {
  return (
    <AppLayout showBackButton title="创建小红书帖子">
      <div className="max-w-4xl mx-auto">
        <XiaohongshuForm />
      </div>
    </AppLayout>
  )
}

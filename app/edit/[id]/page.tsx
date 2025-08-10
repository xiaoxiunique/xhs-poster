import { XiaohongshuForm } from "@/components/xiaohongshu-form"
import { getPostById } from "@/app/actions"
import { notFound } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { PublishButton } from "@/components/publish-button"

export default async function EditPage(context: any) {
  const params = await context.params
  const postId = Number.parseInt(params.id)
  const post = await getPostById(postId)

  if (!post) {
    notFound()
  }

  return (
    <AppLayout showBackButton title="编辑小红书帖子">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">编辑帖子</h1>
          <PublishButton postId={post.id} />
        </div>
        <XiaohongshuForm
          initialData={{
            id: post.id,
            title: post.title,
            content: post.content,
            tags: post.tags.map((tag) => tag.name),
            images: post.images.map((img) => img.url),
          }}
        />
      </div>
    </AppLayout>
  )
}

import "server-only"

export type StoredAccount = {
  id: number
  name: string
  cookie?: string
  status: "active" | "expired" | "unknown"
  lastChecked?: string | null
  createdAt?: string
}

export type StoredImage = {
  id: number
  post_id: number
  url: string
  file_name: string | null
  display_order: number
}

export type StoredTag = {
  id: number
  name: string
}

export type StoredPostSummary = {
  id: number
  title: string
  content: string
  status: string
  created_at: string
  updated_at: string
  user_id: number
  coverImage?: string | null
  images: string[]
  tags: string[]
}

export type StoredPost = Omit<StoredPostSummary, "coverImage" | "images" | "tags"> & {
  images: StoredImage[]
  tags: StoredTag[]
}

type HostRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown>
}

function getHostServerUrl(): string {
  const url = process.env.HOST_SERVER_URL || process.env.XHS_POSTER_HOST_SERVER_URL
  if (!url) {
    throw new Error("Missing HOST_SERVER_URL for xhs-poster storage")
  }
  return url.replace(/\/+$/g, "")
}

function getHostServerPublicUrl(): string {
  return (process.env.HOST_SERVER_PUBLIC_URL || process.env.XHS_POSTER_HOST_SERVER_PUBLIC_URL || getHostServerUrl()).replace(
    /\/+$/g,
    "",
  )
}

function toPublicHostAssetUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (!parsed.pathname.startsWith("/xhs-poster/assets/")) return url
    return `${getHostServerPublicUrl()}${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

function getHostServerToken(): string {
  const token = process.env.XHS_POSTER_API_TOKEN || process.env.HOST_SERVER_API_TOKEN
  if (!token) {
    throw new Error("Missing XHS_POSTER_API_TOKEN for host-server storage")
  }
  return token
}

async function hostRequest<T>(path: string, init: HostRequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${getHostServerToken()}`)

  let body = init.body
  if (body && !(body instanceof FormData) && !(body instanceof Blob) && typeof body !== "string") {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(body)
  }

  const response = await fetch(`${getHostServerUrl()}/xhs-poster${path}`, {
    ...init,
    headers,
    body: body as BodyInit | undefined,
    cache: "no-store",
  })

  const contentType = response.headers.get("content-type") || ""
  const payload = contentType.includes("application/json") ? await response.json() : await response.text()
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload ? String(payload.error) : `host-server ${response.status}`
    throw new Error(message)
  }
  return payload as T
}

export async function uploadImageToHost(file: File) {
  const formData = new FormData()
  formData.set("file", file)
  const result = await hostRequest<{ success: true; url: string; key: string }>("/upload", {
    method: "POST",
    body: formData,
  })
  return { ...result, url: toPublicHostAssetUrl(result.url) }
}

export async function listAccounts() {
  return hostRequest<{ accounts: StoredAccount[] }>("/accounts")
}

export async function createAccount(input: {
  name: string
  cookie: string
  user_id?: string
  nickname?: string
  avatar?: string
}) {
  return hostRequest<{ success: true; id: number }>("/accounts", {
    method: "POST",
    body: input,
  })
}

export async function getAccount(id: number) {
  return hostRequest<StoredAccount>(`/accounts/${id}`)
}

export async function deleteAccount(id: number) {
  return hostRequest<{ success: true }>(`/accounts/${id}`, { method: "DELETE" })
}

export async function checkAccount(id: number) {
  return hostRequest<{ status: StoredAccount["status"] }>(`/accounts/${id}/check`, { method: "POST" })
}

export async function activateAccount(id: number) {
  return hostRequest<{ success: true }>(`/accounts/${id}/activate`, { method: "POST" })
}

export async function getActiveAccount(id?: number) {
  const query = id ? `?id=${id}` : ""
  return hostRequest<{ account: StoredAccount | null }>(`/accounts/active${query}`)
}

export async function getSettings() {
  return hostRequest<{
    titlePrompt: string
    contentPrompt: string
    commonTags: unknown[]
  }>("/settings")
}

export async function saveSettings(input: { titlePrompt: string; contentPrompt: string; commonTags: unknown[] }) {
  return hostRequest<{ success: true }>("/settings", {
    method: "POST",
    body: input,
  })
}

export async function getCommonTags() {
  return hostRequest<{ tags: unknown[] }>("/common-tags")
}

export async function listPosts(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ""
  return hostRequest<{ posts: StoredPostSummary[] }>(`/posts${query}`)
}

export async function savePostToHost(input: {
  postId?: number
  title: string
  content: string
  status: string
  images: string[]
  tags: string[]
}) {
  return hostRequest<{ success: true; postId: number; redirectTo: string }>("/posts", {
    method: "POST",
    body: input,
  })
}

export async function getPostFromHost(id: number) {
  return hostRequest<{ post: StoredPost }>(`/posts/${id}`)
}

export async function getLatestPost(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ""
  return hostRequest<{ post: StoredPostSummary }>(`/posts/latest${query}`)
}

export async function deletePostFromHost(id: number) {
  return hostRequest<{ success: true }>(`/posts/${id}`, { method: "DELETE" })
}

export async function markPostPublished(id: number) {
  return hostRequest<{ success: true; post: StoredPostSummary }>(`/posts/${id}/published`, { method: "POST" })
}

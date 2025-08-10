export interface UserInfoResponse {
  user_id: string
  nickname: string
  avatar: string
}

interface ApiResponse<T> {
  success: boolean
  code: number
  msg: string
  data: T
}

export async function verifyXhsCookie(cookie: string): Promise<UserInfoResponse | null> {
  try {
    // 使用我们的代理API
    const response = await fetch("/api/proxy/user-info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cookie }),
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data: ApiResponse<UserInfoResponse> = await response.json()

    // 检查API响应是否成功
    if (data.success && data.code === 0 && data.data && data.data.user_id) {
      return data.data
    } else {
      console.error("验证cookie失败:", data.msg)
      return null
    }
  } catch (error) {
    console.error("验证cookie时出错:", error)
    return null
  }
}

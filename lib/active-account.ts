import "server-only"

import { cookies } from "next/headers"
import { getActiveAccount } from "@/lib/host-storage"

export async function getActiveXhsAccount() {
  const cookieStore = await cookies()
  const activeAccountId = cookieStore.get("xhs_active_account")?.value
  const parsedId = activeAccountId ? Number.parseInt(activeAccountId) : Number.NaN
  const { account } = await getActiveAccount(Number.isFinite(parsedId) ? parsedId : undefined)
  return account
}

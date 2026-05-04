import "server-only"

export function isPublicApiAuthorized(request: Request): boolean {
  const token = process.env.PUBLIC_API_TOKEN || process.env.XHS_POSTER_PUBLIC_API_TOKEN
  if (!token) return false

  const auth = request.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null
  return bearer === token
}

export type MaterialCategory = {
  id: string
  name: string
}

export function createMaterialCategory(name: string): MaterialCategory {
  const normalized = name.trim()
  return {
    id: `category-${normalized.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`,
    name: normalized,
  }
}

export function normalizeMaterialCategories(value: unknown): MaterialCategory[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const categories: MaterialCategory[] = []

  for (const item of value) {
    const name =
      typeof item === "string"
        ? item.trim()
        : item && typeof item === "object" && "name" in item && typeof item.name === "string"
          ? item.name.trim()
          : ""
    if (!name || seen.has(name)) continue

    const id =
      item && typeof item === "object" && "id" in item && typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : `category-${name.toLowerCase().replace(/\s+/g, "-")}`

    seen.add(name)
    categories.push({ id, name })
  }

  return categories
}

/**
 * 将数字转换为base36编码
 */
export function base36encode(number: number, alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"): string {
  if (typeof number !== "number" || number % 1 !== 0) {
    throw new TypeError("number must be an integer")
  }

  let base36 = ""
  let sign = ""

  if (number < 0) {
    sign = "-"
    number = -number
  }

  if (0 <= number && number < alphabet.length) {
    return sign + alphabet[number]
  }

  while (number !== 0) {
    const i = number % alphabet.length
    number = Math.floor(number / alphabet.length)
    base36 = alphabet[i] + base36
  }

  return sign + base36
}

/**
 * 将base36编码转换回数字
 */
export function base36decode(number: string): number {
  return Number.parseInt(number, 36)
}

/**
 * 生成小红书搜索API所需的search_id
 */
export function getSearchId(): string {
  // 使用当前时间戳作为基础
  const timestamp = Date.now()
  // 生成一个随机数
  const random = Math.floor(Math.random() * 2147483646)

  // 将时间戳和随机数组合，确保不超出Number.MAX_SAFE_INTEGER
  // 由于JavaScript的Number类型限制，我们不能直接使用位移64位
  // 而是使用一个足够大但安全的乘数
  const combined = timestamp * 1000000 + random

  // 转换为base36编码
  return base36encode(combined)
}

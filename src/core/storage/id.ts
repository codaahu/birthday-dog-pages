/**
 * 生成可跨轮次和标签页使用的随机 ID
 *
 * @date 2026/11/24 10:54
 * @return 基于浏览器加密随机源的 128 位 ID
 */
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

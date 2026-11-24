// 同一页面内合并相同的预取请求
const prefetched = new Map<string, Promise<void>>()

/**
 * 低优先级预取页面稍后会使用的图片
 *
 * @author 何齐龙
 * @date 2026/11/24 22:48
 * @param path 带站点前缀的图片路径，开发用数据地址无需预取
 * @return 请求加载结束，或当前网络设置不允许预取时完成
 */
export function prefetchImage(path: string): Promise<void> {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData || path.startsWith('data:')) {
    return Promise.resolve()
  }

  const url = new URL(path, document.baseURI).href
  const existing = prefetched.get(url)
  if (existing) {
    return existing
  }

  const request = new Promise<void>((resolve) => {
    const image = new Image()
    image.fetchPriority = 'low'
    image.onload = () => resolve()
    image.onerror = () => {
      prefetched.delete(url)
      resolve()
    }
    image.src = url
  })
  prefetched.set(url, request)
  return request
}

/**
 * 从存档读取有效的开场页码
 *
 * @date 2026/11/24 11:23
 * @param page 存档中保存的页码
 * @param lineCount 当前开场对白行数
 * @return 0 为封面，其余页码对应对白
 */
export function restoredPage(page: unknown, lineCount: number) {
  if (typeof page === 'number' && Number.isInteger(page) && page >= 0 && page <= lineCount) {
    return page
  }
  return 0
}
import type { Dog } from '../../config/assets'


/**
 * 按现有对白页码识别发言角色
 *
 * @date 2026/11/24 12:25
 * @param page 现有主线对白页码
 * @param replay 是否播放重玩对白
 * @return 当前发言角色，封面为 undefined
 */
export function faceForPage(page: number, replay: boolean): Dog | undefined {
  if (page === 0) {
    return undefined
  }
  return !replay && page === 2 ? 'maltese' : 'golden'
}

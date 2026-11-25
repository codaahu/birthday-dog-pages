import type { AchievementId } from '../../config/achievements'
import type { BirthdayDatabase } from './database'
import type { Unlock } from './types'

/**
 * 在调用方的读写事务里补齐未领取的成就
 *
 * @date 2026/11/25 11:23
 * @param db 当前存档连接，调用方事务需包含 achievements 表
 * @param ids 校验通过的成就 ID，重复 ID 只检查一次
 * @param source 解锁时间及轮次，跨轮收集使用 null
 * @return 本次首次写入的成就 ID
 */
export async function addAchievements(
  db: BirthdayDatabase, ids: readonly AchievementId[], source: Pick<Unlock, 'createdAt' | 'runId'>,
) {
  const unique = [...new Set(ids)]
  if (!unique.length) {
    return []
  }
  const existing = await db.achievements.bulkGet(unique)
  const unlocked = unique.filter((_, index) => !existing[index])
  if (unlocked.length) {
    await db.achievements.bulkAdd(unlocked.map((id) => ({ id, createdAt: source.createdAt, runId: source.runId })))
  }
  return unlocked
}

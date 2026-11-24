import type { AchievementId } from '../../config/achievements'
import { chapters } from '../../config/storyFlow'
import type { BirthdayDatabase } from './database'
import type { GameResult, MemoryRecord, Work } from './types'

export class HistoryService {
  constructor(private readonly db: BirthdayDatabase) {}

  /**
   * 读取本地作品、结果与收藏记录
   *
   * @date 2026/11/24 10:54
   * @return 各类历史记录，未产生记录时为空列表
   */
  async read() {
    return this.db.transaction('r', [
      this.db.works, this.db.gameResults, this.db.memoryRecords, this.db.tickets,
      this.db.achievements, this.db.easterEggs, this.db.completions,
    ], async () => {
      const [works, results, memories, tickets, achievements, easterEggs, completions] = await Promise.all([
        this.db.works.toArray(), this.db.gameResults.toArray(), this.db.memoryRecords.toArray(),
        this.db.tickets.toArray(), this.db.achievements.toArray(), this.db.easterEggs.toArray(),
        this.db.completions.toArray(),
      ])
      return { works, results, memories, tickets, achievements, easterEggs, completions }
    })
  }

  /**
   * 获取历史冒险里已获得的章节纪念章
   *
   * @date 2026/11/24 19:27
   * @return 已存档的唯一章节数量
   */
  async chapterMarks() {
    const runs = await this.db.runs.toArray()
    return chapters.filter(({ id }) => runs.some((run) => Boolean(run.chapters[id]))).length
  }

  /**
   * 以调用方稳定 ID 保存作品快照及对应成就，重复提交返回已保存作品
   *
   * @date 2026/11/24 11:51
   * @param work 作品 ID、种类、快照与轮次；独立创作时轮次为 null
   * @param achievement 与作品同时提交的成就 ID，可省略
   * @return 首次保存的作品快照
   */
  async saveWork(work: Omit<Work, 'favorite' | 'createdAt'>, achievement?: AchievementId): Promise<Work> {
    return this.db.transaction('rw', this.db.works, this.db.achievements, async () => {
      const existing = await this.db.works.get(work.id)
      const record = existing ?? { ...work, favorite: false, createdAt: new Date().toISOString() }
      if (!existing) {
        await this.db.works.add(record)
      }
      if (achievement && !(await this.db.achievements.get(achievement))) {
        await this.db.achievements.add({ id: achievement, runId: record.runId, createdAt: record.createdAt })
      }
      return record
    })
  }

  /**
   * 保存一局结果，重试沿用同一结果 ID
   *
   * @date 2026/11/24 10:54
   * @param result 结果 ID、种类、完成状态和相应的实际成绩
   * @return 首次保存的成绩或跳过记录
   */
  async saveResult(result: Omit<GameResult, 'createdAt'>): Promise<GameResult> {
    return this.db.transaction('rw', this.db.gameResults, async () => {
      const { record } = await this.storeResult(result)
      return record
    })
  }

  /**
   * 原子提交计分结果、刷新纪录状态和本次首次成就
   *
   * @date 2026/11/24 16:00
   * @param result 已完成的计分记录，重试时 ID 不变
   * @param awards 此分数触发的成就 ID
   * @return 持久成绩、历史最高分、是否刷新纪录和当次新成就
   */
  async settleScoredResult(result: Omit<GameResult, 'createdAt'> & { score: number; status: 'completed' }, awards: readonly AchievementId[]) {
    return this.db.transaction('rw', this.db.gameResults, this.db.achievements, async () => {
      const { record, inserted } = await this.storeResult(result)
      const scores = await this.db.gameResults.where('kind').equals(record.kind)
        .and((item) => item.status === 'completed' && item.id !== record.id).toArray()
      const previousBest = scores.reduce((best, item) => Math.max(best, item.score ?? 0), 0)
      const highestScore = Math.max(previousBest, record.score ?? 0)
      const unlocked: AchievementId[] = []

      if (inserted) {
        for (const id of new Set(awards)) {
          if (!(await this.db.achievements.get(id))) {
            await this.db.achievements.add({ id, runId: record.runId, createdAt: record.createdAt })
            unlocked.push(id)
          }
        }
      }

      return { record, highestScore, newRecord: inserted && highestScore > previousBest, unlocked }
    })
  }

  /**
   * 更新已有作品的收藏状态
   *
   * @date 2026/11/24 10:54
   * @param id 已保存的作品 ID
   * @param favorite 是否收藏
   * @return 修改的记录数，作品不存在时为 0
   */
  favoriteWork(id: string, favorite: boolean) {
    return this.db.works.update(id, { favorite })
  }

  /**
   * 按照片 ID 记下探索，同时保留首次查看时间
   *
   * @date 2026/11/24 11:25
   * @param id 素材 manifest 中的稳定照片 ID
   * @param changes 探索、收藏或拼图收录状态，只提交要更新的字段
   * @return 更新后的照片记录
   */
  async remember(id: string, changes: Partial<Pick<MemoryRecord, 'explored' | 'favorite' | 'collected'>>) {
    return this.db.transaction('rw', this.db.memoryRecords, async () => {
      const existing = await this.db.memoryRecords.get(id)
      const record = {
        ...(existing ?? { id, explored: false, favorite: false, firstViewedAt: new Date().toISOString() }),
        ...changes,
      }
      await this.db.memoryRecords.put(record)
      return record
    })
  }

  /**
   * 只记录一次成就解锁
   *
   * @date 2026/11/24 13:54
   * @param id 成就配置中的稳定 ID
   * @param runId 解锁时的轮次，独立玩法传 null
   * @return 事务写入新成就时为 true，已有记录时为 false
   */
  async unlock(id: AchievementId, runId: string | null) {
    return this.db.transaction('rw', this.db.achievements, async () => {
      if (await this.db.achievements.get(id)) {
        return false
      }
      await this.db.achievements.add({ id, runId, createdAt: new Date().toISOString() })
      return true
    })
  }

  /**
   * 记录首次发现彩蛋
   *
   * @date 2026/11/24 10:54
   * @param id 彩蛋的稳定 ID
   * @param runId 发现时的轮次，独立玩法传 null
   */
  async discover(id: string, runId: string | null) {
    await this.db.transaction('rw', this.db.easterEggs, async () => {
      if (!(await this.db.easterEggs.get(id))) {
        await this.db.easterEggs.add({ id, runId, createdAt: new Date().toISOString() })
      }
    })
  }

  /**
   * 根据稳定作品 ID 恢复已经保存的成品
   *
   * @date 2026/11/24 11:51
   * @param id 草稿引用的作品 ID
   * @return 成品记录，尚未保存时为 undefined
   */
  getWork(id: string) {
    return this.db.works.get(id)
  }

  /**
   * 在调用方持有的成绩事务中获取同 ID 记录或首次写入
   *
   * @date 2026/11/24 16:00
   * @param result 尚未附上保存时间的成绩
   * @return 保留的记录和本次是否发生写入
   */
  private async storeResult(result: Omit<GameResult, 'createdAt'>) {
    const existing = await this.db.gameResults.get(result.id)
    if (existing) {
      return { record: existing, inserted: false }
    }

    const record = { ...result, createdAt: new Date().toISOString() }
    await this.db.gameResults.add(record)
    return { record, inserted: true }
  }
}

import type { EntityTable } from 'dexie'
import { achievementNames } from '../../config/achievements'
import { ordinaryTickets, weekendTicket } from '../../config/rewards'
import { chapters, storyFlow } from '../../config/storyFlow'
import { schemaVersion, type BirthdayDatabase } from './database'
import {
  defaultSettings, type Completion, type Draw, type DrawCommand, type EasterEgg, type GameResult, type MemoryRecord,
  type Profile, type Run, type Ticket, type Unlock, type WalletEntry, type Work,
} from './types'

const tableNames = ['profile', 'runs', 'works', 'gameResults', 'memoryRecords', 'walletEntries', 'tickets',
  'draws', 'drawCommands', 'achievements', 'easterEggs', 'completions'] as const
type TableName = typeof tableNames[number]
interface BackupData {
  profile: Profile[]
  runs: Run[]
  works: Work[]
  gameResults: GameResult[]
  memoryRecords: MemoryRecord[]
  walletEntries: WalletEntry[]
  tickets: Ticket[]
  draws: Draw[]
  drawCommands: DrawCommand[]
  achievements: Unlock[]
  easterEggs: EasterEgg[]
  completions: Completion[]
}
type Entry = Record<string, unknown>
const maxBackupBytes = 8 * 1024 * 1024
const ticketDefinitions = [...ordinaryTickets, weekendTicket]
const allowedChapters: readonly string[] = chapters.map(({ id }) => id)
const checkpointKeys: readonly string[] = storyFlow

/**
 * 按当前存档格式导出和事务合并本机历史
 *
 * @date 2026/11/24 19:24
 */
export class BackupService {
  constructor(private readonly db: BirthdayDatabase) {}

  /**
   * 从同一个读事务取得完整快照，余额由流水恢复
   *
   * @date 2026/11/24 19:24
   * @return 不含原始照片的 JSON 备份
   */
  exportJson() {
    return this.db.transaction('r', this.db.tables, async () => {
      const entries = await Promise.all(tableNames.map(async (name) => [name, await this.db[name].toArray()]))
      return JSON.stringify({ format: 'birthday-dog', schemaVersion, tables: Object.fromEntries(entries) }, null, 2)
    })
  }

  /**
   * 校验备份并返回确认前能看到的记录数
   *
   * @date 2026/11/24 19:24
   * @param text 用户选择的 JSON 文件内容
   * @return 文件内的作品、游戏、兑换券及完整冒险数量
   */
  preview(text: string) {
    const data = readBackup(text)
    return { works: data.works.length, games: data.gameResults.length, tickets: data.tickets.length,
      completions: data.completions.length }
  }

  /**
   * 确认后重新校验并原子合并备份，任何冲突都不会造成部分写入
   *
   * @date 2026/11/24 19:24
   * @param text 用户已预览并确认的原始 JSON
   */
  async merge(text: string) {
    const data = readBackup(text)
    const db = this.db
    await db.transaction('rw', db.tables, async () => {
      const localProfile = await db.profile.get('profile')
      const sourceProfile = data.profile[0]

      // 重复的作品与成绩保留本机快照，收藏及发现状态可以合并
      await mergeRows(db.works, data.works, (old, incoming) => ({ ...old, favorite: old.favorite || incoming.favorite }))
      await mergeRows(db.memoryRecords, data.memoryRecords, (old, incoming) => ({
        ...old, firstViewedAt: earlier(old.firstViewedAt, incoming.firstViewedAt)!,
        explored: old.explored || incoming.explored, favorite: old.favorite || incoming.favorite,
        collected: old.collected || incoming.collected,
      }))
      await mergeRows(db.gameResults, data.gameResults)
      await mergeRows(db.achievements, data.achievements)
      await mergeRows(db.easterEggs, data.easterEggs)
      await mergeRows(db.completions, data.completions)

      // 已结束的轮次优先于同 ID 的中途草稿，其余历史不覆盖
      const keepActive = localProfile?.activeRunId ?? sourceProfile?.activeRunId
      const importedRuns = data.runs.map((run): Run => run.status === 'active' && run.id !== keepActive
        ? { ...run, status: 'paused' } : run)
      await mergeRows(db.runs, importedRuns, (old, incoming) =>
        old.status !== 'completed' && incoming.status === 'completed' ? incoming : old)

      const acceptedDraws = await mergeRewards(db, data)
      await mergeRows(db.walletEntries, data.walletEntries.filter((entry) =>
        entry.reason === 'chapter' || acceptedDraws.has(entry.id.slice('draw:'.length))))
      const balance = (await db.walletEntries.toArray()).reduce((sum, entry) => sum + entry.amount, 0)
      if (balance < 0 || !Number.isSafeInteger(balance)) {
        throw new Error('备份的狗狗币流水不完整')
      }
      if (localProfile || sourceProfile) {
        const profile = localProfile ?? sourceProfile!
        const count = await db.completions.count()
        const activeRun = keepActive ? await db.runs.get(keepActive) : undefined
        const draft = activeRun?.status === 'active' ? activeRun : undefined
        const lastRunId = draft?.id ?? localProfile?.lastRunId ?? sourceProfile?.lastRunId
        const firstCompletedAt = earlier(localProfile?.firstCompletedAt, sourceProfile?.firstCompletedAt)
        const everCompleted = Boolean(localProfile?.everCompleted || sourceProfile?.everCompleted || count)
        await db.profile.put({
          ...profile, schemaVersion, everCompleted, firstCompletedAt,
          completedCount: Math.max(count, localProfile?.completedCount ?? 0, sourceProfile?.completedCount ?? 0),
          firstVisitedAt: earlier(localProfile?.firstVisitedAt, sourceProfile?.firstVisitedAt)!,
          activeRunId: draft?.id, lastRunId, settings: { ...defaultSettings, ...profile.settings },
        })
      }
      await db.wallet.put({ id: 'wallet', balance })
    })
  }
}

/**
 * 识别 JSON 对象，供导入边界兼容可选字段
 *
 * @date 2026/11/24 19:24
 * @param value 解析后的任意 JSON 值
 * @return 是否为非数组对象
 */
function object(value: unknown): value is Entry {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 校验日期字段可被用作存档时间
 *
 * @date 2026/11/24 19:24
 * @param value 备份字段
 * @return 有效标准时间字符串时为 true
 */
function date(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

/**
 * 按表验证进入事务前需要的主键、枚举和渲染数据
 *
 * @date 2026/11/24 19:24
 * @param name 存档表名
 * @param row 可能包含旧版本省略字段的 JSON 记录
 * @return 是否满足该表的存档契约
 */
function validRow(name: TableName, row: Entry) {
  const reference = row.runId === null || typeof row.runId === 'string'
  const status = row.status === 'completed' || row.status === 'skipped'
  const issued = date(row.createdAt) && reference
  switch (name) {
    case 'profile':
      return row.id === 'profile' && date(row.firstVisitedAt) && typeof row.everCompleted === 'boolean'
        && object(row.settings) && typeof row.settings.music === 'boolean' && typeof row.settings.sound === 'boolean'
        && typeof row.settings.volume === 'number' && row.settings.volume >= 0 && row.settings.volume <= 1
        && Number.isSafeInteger(row.completedCount) && Number(row.completedCount) >= 0
        && (row.firstCompletedAt === undefined || date(row.firstCompletedAt))
        && ['activeRunId', 'lastRunId'].every((key) => row[key] === undefined || typeof row[key] === 'string')
    case 'runs':
      return date(row.createdAt) && (row.completedAt === undefined || date(row.completedAt))
        && (row.kind === 'first' || row.kind === 'replay') && (row.status === 'active' || row.status === 'paused' || row.status === 'completed')
        && typeof row.step === 'string' && checkpointKeys.includes(row.step)
        && [row.steps, row.chapters].every((value) => object(value)
          && Object.values(value).every((step) => step === 'completed' || step === 'skipped'))
        && object(row.drafts) && object(row.statistics)
    case 'works':
      return issued && typeof row.favorite === 'boolean' && object(row.snapshot) && (row.kind === 'bouquet' || row.kind === 'cake')
    case 'gameResults':
      return issued && status && (row.kind === 'puzzle' || row.kind === 'catch-gifts' || row.kind === 'couple-quiz')
        && ['score', 'timeMs', 'moves'].every((key) => row[key] === undefined
          || Number.isSafeInteger(row[key]) && Number(row[key]) >= 0)
        && (row.details === undefined || object(row.details)) && (row.answerSnapshot === undefined || object(row.answerSnapshot))
    case 'memoryRecords':
      return date(row.firstViewedAt) && typeof row.explored === 'boolean' && typeof row.favorite === 'boolean'
        && (row.collected === undefined || typeof row.collected === 'boolean')
    case 'walletEntries':
      return issued && (row.reason === 'chapter'
        ? typeof row.runId === 'string' && typeof row.chapterId === 'string' && allowedChapters.includes(row.chapterId)
          && row.amount === 1 && row.id === 'chapter:' + row.runId + ':' + row.chapterId
        : row.reason === 'draw' && row.amount === -1 && String(row.id).startsWith('draw:'))
    case 'tickets':
      return issued && ticketDefinitions.some(({ type, rarity }) => type === row.type && rarity === row.rarity)
        && (row.type === 'weekend-meeting' || row.issuanceKey === undefined)
        && (row.usedAt === undefined || date(row.usedAt)) && (row.validUntil === undefined || date(row.validUntil))
    case 'draws':
      return issued && typeof row.ticketId === 'string' && Number.isSafeInteger(row.number) && Number(row.number) > 0
        && (row.revealedAt === undefined || date(row.revealedAt))
    case 'drawCommands':
      return typeof row.drawId === 'string'
    case 'achievements':
      return issued && typeof row.id === 'string' && Object.prototype.hasOwnProperty.call(achievementNames, row.id)
    case 'completions':
      return date(row.createdAt) && object(row.statistics)
    case 'easterEggs':
      return issued
  }
}

/**
 * 解析备份，阻止不完整记录、重复主键及无效引用
 *
 * @date 2026/11/24 19:24
 * @param text JSON 文本
 * @return 当前版本的可合并存档数据
 */
function readBackup(text: string): BackupData {
  if (text.length > maxBackupBytes) {
    throw new Error('备份文件超过 8 MB')
  }
  const raw: unknown = JSON.parse(text)
  if (!object(raw) || raw.format !== 'birthday-dog' || raw.schemaVersion !== schemaVersion || !object(raw.tables)) {
    throw new Error('请选择本网站当前版本导出的存档')
  }
  const data = raw.tables
  for (const name of tableNames) {
    const rows = data[name]
    const ids = new Set<string>()
    if (!Array.isArray(rows)) {
      throw new Error('备份缺少存档表')
    }
    for (const row of rows) {
      if (!object(row) || typeof row.id !== 'string' || !row.id || ids.has(row.id) || !validRow(name, row)) {
        throw new Error('备份记录格式有误')
      }
      ids.add(row.id)
    }
  }
  const backup = data as unknown as BackupData
  const tickets = new Map(backup.tickets.map((ticket) => [ticket.id, ticket]))
  const draws = new Map(backup.draws.map((draw) => [draw.id, draw]))
  if (backup.draws.some((draw) => tickets.get(draw.ticketId)?.runId !== draw.runId)
    || backup.drawCommands.some((command) => !draws.has(command.drawId))
    || backup.walletEntries.some((entry) => entry.reason === 'draw' && draws.get(entry.id.slice(5))?.runId !== entry.runId)) {
    throw new Error('备份的兑换券与流水记录不匹配')
  }
  return backup
}

/**
 * 按主键写入新记录并按表规则合并同 ID 记录
 *
 * @date 2026/11/24 19:24
 * @param table 当前事务内的目标表
 * @param rows 已校验的导入记录
 * @param resolve 已有记录与传入记录的合并方式，默认保留现有记录
 */
async function mergeRows<T extends { id: string }>(table: EntityTable<T, 'id'>, rows: T[],
  resolve?: (old: T, incoming: T) => T) {
  const ids = rows.map((row) => row.id) as Parameters<EntityTable<T, 'id'>['bulkGet']>[0]
  const current = await table.bulkGet(ids)
  const changed: T[] = []
  for (const [index, incoming] of rows.entries()) {
    const existing = current[index]
    if (!existing) {
      changed.push(incoming)
    } else if (resolve) {
      changed.push(resolve(existing, incoming))
    }
  }
  await table.bulkPut(changed)
}

/**
 * 合并已兑现、已揭晓状态并消除跨档冲突的周末券及抽取记录
 *
 * @date 2026/11/24 19:24
 * @param db 当前合并事务的存档
 * @param data 已校验的备份
 * @return 接纳的抽取 ID，用于联动导入扣币流水
 */
async function mergeRewards(db: BirthdayDatabase, data: BackupData) {
  const localTickets = await db.tickets.toArray()
  const tickets = new Map(localTickets.map((ticket) => [ticket.id, ticket]))
  let weekend = localTickets.find(({ type }) => type === 'weekend-meeting')
  const skipped = new Set<string>()
  for (const ticket of data.tickets) {
    const existing = tickets.get(ticket.id)
    const same = existing ?? (ticket.type === 'weekend-meeting' ? weekend : undefined)
    if (same) {
      if (same.type === ticket.type && !same.usedAt && ticket.usedAt) {
        same.usedAt = ticket.usedAt
        await db.tickets.put(same)
      }
      if (same.id !== ticket.id || same.type !== ticket.type || same.runId !== ticket.runId) {
        skipped.add(ticket.id)
      }
    } else {
      const record: Ticket = ticket.type === 'weekend-meeting' ? { ...ticket, issuanceKey: 'weekend-meeting' } : ticket
      await db.tickets.add(record)
      tickets.set(record.id, record)
      if (record.type === 'weekend-meeting') {
        weekend = record
      }
    }
  }

  const localDraws = await db.draws.toArray()
  const byTicket = new Set(localDraws.map(({ ticketId }) => ticketId))
  const drawIds = new Map(localDraws.map((draw) => [draw.id, draw]))
  const positions = new Set(localDraws.filter(({ runId }) => runId !== null)
    .map(({ runId, number }) => JSON.stringify([runId, number])))
  const accepted = new Set<string>()
  for (const draw of data.draws) {
    const existing = drawIds.get(draw.id)
    const position = JSON.stringify([draw.runId, draw.number])
    if (skipped.has(draw.ticketId)) {
      continue
    }
    if (existing) {
      if (existing.ticketId === draw.ticketId && existing.runId === draw.runId) {
        accepted.add(draw.id)
        if (!existing.revealedAt && draw.revealedAt) {
          await db.draws.update(draw.id, { revealedAt: draw.revealedAt })
        }
      }
    } else if (!byTicket.has(draw.ticketId) && (draw.runId === null || !positions.has(position))) {
      await db.draws.add(draw)
      byTicket.add(draw.ticketId)
      drawIds.set(draw.id, draw)
      positions.add(position)
      accepted.add(draw.id)
    }
  }
  await mergeRows(db.drawCommands, data.drawCommands.filter(({ drawId }) => accepted.has(drawId)))
  return accepted
}

/**
 * 保留两个档案中更早的历史时间
 *
 * @date 2026/11/24 19:24
 * @param a 本机时间，可空
 * @param b 导入时间，可空
 * @return 更早的时间，二者都为空时返回 undefined
 */
function earlier(a: string | undefined, b: string | undefined) {
  if (a && b) {
    return Date.parse(a) <= Date.parse(b) ? a : b
  }
  return a ?? b
}

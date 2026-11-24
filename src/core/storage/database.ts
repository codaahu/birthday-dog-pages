import Dexie, { type EntityTable } from 'dexie'
import {
  defaultSettings,
  type Completion, type Draw, type DrawCommand, type EasterEgg, type GameResult, type MemoryRecord,
  type Profile, type Run, type Ticket, type Unlock, type Wallet, type WalletEntry, type Work,
} from './types'

export const schemaVersion = 2
export const productionDatabaseName = 'birthday-dog'
export const developmentDatabaseName = 'birthday-dog-dev'

export const versionOneStores = {
  profile: 'id',
  runs: 'id, status',
  works: 'id, runId, kind',
  gameResults: 'id, runId, kind',
  memoryRecords: 'id',
  wallet: 'id',
  walletEntries: 'id, runId, [runId+chapterId]',
  tickets: 'id, runId, &issuanceKey',
  draws: 'id, runId, &ticketId',
  achievements: 'id',
  easterEggs: 'id',
  completions: 'id',
}

export class BirthdayDatabase extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  runs!: EntityTable<Run, 'id'>
  works!: EntityTable<Work, 'id'>
  gameResults!: EntityTable<GameResult, 'id'>
  memoryRecords!: EntityTable<MemoryRecord, 'id'>
  wallet!: EntityTable<Wallet, 'id'>
  walletEntries!: EntityTable<WalletEntry, 'id'>
  tickets!: EntityTable<Ticket, 'id'>
  draws!: EntityTable<Draw, 'id'>
  drawCommands!: EntityTable<DrawCommand, 'id'>
  achievements!: EntityTable<Unlock, 'id'>
  easterEggs!: EntityTable<EasterEgg, 'id'>
  completions!: EntityTable<Completion, 'id'>

  /**
   * 打开指定环境的存档并迁移缺少新字段的旧记录
   *
   * @date 2026/11/24 10:54
   * @param name IndexedDB 名称，测试与开发环境使用独立名称
   */
  constructor(name: string) {
    super(name)
    this.version(1).stores(versionOneStores)
    this.version(schemaVersion).stores({
      ...versionOneStores,
      runs: 'id, status, kind',
      draws: 'id, runId, &ticketId, &[runId+number]',
      drawCommands: 'id',
    }).upgrade(async (transaction) => {
      // 保留旧记录，只补齐新增字段
      await transaction.table<Profile>('profile').toCollection().modify((profile) => {
        profile.schemaVersion = schemaVersion
        profile.settings = { ...defaultSettings, ...profile.settings }
        profile.completedCount ??= profile.everCompleted ? 1 : 0
      })
      await transaction.table<Run>('runs').toCollection().modify((run) => {
        run.drafts ??= {}
        run.chapters ??= {}
        run.statistics ??= {}
      })
    })
  }
}

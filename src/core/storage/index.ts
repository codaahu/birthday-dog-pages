import { RewardService } from '../rewards'
import { StoryService } from '../story/service'
import { BirthdayDatabase, developmentDatabaseName, productionDatabaseName } from './database'
import { HistoryService } from './history'
import { BackupService } from './backup'

/**
 * 创建同一存档上的剧情、奖励和历史服务
 *
 * @date 2026/11/24 19:24
 * @param name 可选的独立存档名，默认取运行环境的命名空间
 * @return 使用同一 IndexedDB 连接的公共服务
 */
export function createServices(name = import.meta.env.DEV ? developmentDatabaseName : productionDatabaseName) {
  const db = new BirthdayDatabase(name)
  const rewards = new RewardService(db)
  return { db, story: new StoryService(db, rewards), rewards, history: new HistoryService(db), backup: new BackupService(db) }
}

export type Services = Omit<ReturnType<typeof createServices>, 'db'>

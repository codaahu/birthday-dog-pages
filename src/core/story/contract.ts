import type { Component } from 'vue'
import type { MusicScene } from '../../config/assets'
import type { PhotoManifest } from '../../config/photos'
import type { Mode, ModuleId } from '../../config/storyFlow'
import type { Accent } from '../../config/theme'
import type { HistoryService } from '../storage/history'
import type { RewardService } from '../rewards'
import type { BackupService } from '../storage/backup'
import type { Settings, Snapshot, StepStatus } from '../storage/types'

export interface CollectionSelection {
  workId?: string
  album?: PhotoManifest['photos'][number]['category']
  puzzle?: boolean
}

export interface CollectionControls {
  settings: Settings
  canResume: boolean
  busy: boolean
  openModule: (id: ModuleId, selection?: CollectionSelection) => void
  replay: (action: 'start' | 'resume') => void
  updateSettings: (changes: Partial<Settings>) => Promise<void>
  refresh: () => Promise<void>
}

export interface ModuleConfig {
  id: ModuleId
  title: string
  accent: Accent
  music: MusicScene
  stage: 2 | 3 | 4 | 5 | 6
  playable?: true
}

export interface ModuleContext {
  mode: Mode
  runId: string | null
  replay: boolean
  now: number
  photos: PhotoManifest
  draft?: Snapshot
  /** 已完成关卡提交的本轮统计 */
  roundStatistics?: Readonly<Snapshot>
  collectionSelection?: CollectionSelection
  data: {
    history: HistoryService
    backup?: BackupService
    balance: () => Promise<number>
    draw: (commandId: string) => ReturnType<RewardService['draw']>
    rewardShop: () => ReturnType<RewardService['shop']>
    pendingDraw: () => ReturnType<RewardService['pending']>
    revealDraw: RewardService['reveal']
    redeemTicket: RewardService['redeem']
    saveDraft: (draft: Snapshot) => Promise<void>
  }
}

export interface ModuleCompletion {
  status: StepStatus
  statistics?: Snapshot
}

export interface ModuleDefinition {
  config: ModuleConfig
  component: Component
}

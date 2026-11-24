import type { AchievementId } from '../../config/achievements'
import type { TicketType } from '../../config/rewards'
import type { ChapterId, StoryStep } from '../../config/storyFlow'

export interface Settings { music: boolean; sound: boolean; volume: number }
export const defaultSettings: Settings = { music: true, sound: true, volume: 0.55 }

export interface Profile {
  id: 'profile'
  schemaVersion: number
  firstVisitedAt: string
  everCompleted: boolean
  firstCompletedAt?: string
  completedCount: number
  activeRunId?: string
  lastRunId?: string
  settings: Settings
}

export type Snapshot = Record<string, unknown>
export type StepStatus = 'completed' | 'skipped'

export interface Run {
  id: string
  kind: 'first' | 'replay'
  status: 'active' | 'paused' | 'completed'
  step: StoryStep
  steps: Partial<Record<StoryStep, StepStatus>>
  chapters: Partial<Record<ChapterId, StepStatus>>
  drafts: Partial<Record<StoryStep, Snapshot>>
  statistics: Snapshot
  createdAt: string
  completedAt?: string
}

interface HistoricalRecord { id: string; runId: string | null; createdAt: string }

export interface Work extends HistoricalRecord {
  kind: 'bouquet' | 'cake'
  snapshot: Snapshot
  favorite: boolean
}

export interface GameResult extends HistoricalRecord {
  kind: 'puzzle' | 'catch-gifts' | 'couple-quiz'
  status: StepStatus
  score?: number
  timeMs?: number
  moves?: number
  answerSnapshot?: Snapshot
  details?: Snapshot
}

export interface MemoryRecord {
  id: string
  firstViewedAt: string
  explored: boolean
  favorite: boolean
  collected?: boolean
}

export interface Wallet { id: 'wallet'; balance: number }
export interface WalletEntry extends HistoricalRecord {
  amount: number
  reason: 'chapter' | 'draw'
  chapterId?: ChapterId
}

export interface Ticket extends HistoricalRecord {
  type: TicketType
  rarity: 'R' | 'SR' | 'SSR'
  issuanceKey?: 'weekend-meeting'
  validUntil?: string
  usedAt?: string
}

export interface Draw extends HistoricalRecord {
  ticketId: string
  number: number
  revealedAt?: string
}

export interface DrawCommand { id: string; drawId: string }

export interface Unlock extends HistoricalRecord { id: AchievementId }
export interface EasterEgg extends HistoricalRecord {}
export interface Completion { id: string; createdAt: string; statistics: Snapshot }

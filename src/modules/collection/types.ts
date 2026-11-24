import type { CollectionControls, ModuleContext } from '../../core/story/contract'
import type { RewardService } from '../../core/rewards'
import type { HistoryService } from '../../core/storage/history'

export interface ModuleProps {
  context: ModuleContext
  houseControls?: CollectionControls
}

export type HousePage = 'home' | 'games' | 'collection' | 'gifts' | 'albums' | 'bouquet' | 'cake' | 'letter' | 'settings'
export type HouseArchive = Awaited<ReturnType<HistoryService['read']>>
export type RevealedTickets = Awaited<ReturnType<RewardService['shop']>>['revealed']

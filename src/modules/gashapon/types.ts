import type { ModuleContext } from '../../core/story/contract'

export interface ModuleProps {
  context: ModuleContext
}

export type MachinePhase = 'loading' | 'idle' | 'inserting' | 'rolling' | 'capsule' | 'opening' | 'ticket'
export type ShopMood = 'idle' | 'spin' | 'open' | 'ssr'

import type { ModuleContext } from '../../core/story/contract'

export interface ModuleProps {
  context: ModuleContext
}

export type DogPose = 'happy' | 'wag' | 'lie' | 'sleep'

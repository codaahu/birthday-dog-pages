import type { ModuleContext } from '../../core/story/contract'

export interface ModuleProps {
  context: ModuleContext
  completionPending?: boolean
}

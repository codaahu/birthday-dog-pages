import type { ModuleContext } from '../../core/story/contract'

export interface ModuleProps {
  context: ModuleContext
}

export interface MeetingDraft {
  sceneSeen: boolean
  letterOpened: boolean
}

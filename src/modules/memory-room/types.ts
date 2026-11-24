import type { ModuleContext } from '../../core/story/contract'

export interface ModuleProps {
  context: ModuleContext
  roomControls?: RoomControls
}

export interface RoomControls {
  music: boolean
  toggleMusic: () => void
  exit?: () => void
  chapters?: readonly boolean[]
}

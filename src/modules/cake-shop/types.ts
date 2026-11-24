import type { ModuleContext } from '../../core/story/contract'
import type { creams, pieceNames, spongeKinds } from './config'

export interface ModuleProps {
  context: ModuleContext
}

export type PieceKind = keyof typeof pieceNames
export type CakePhase = 'editing' | 'served' | 'candles' | 'wish' | 'finished'

export interface Piece {
  id: string
  slot: number
  kind: PieceKind
  x: number
  y: number
  angle: number
  scale: number
}

export type Candle = { kind: 'plain' } | { kind: 'number'; digits: string }

export interface Cake {
  id: string
  sponge: keyof typeof spongeKinds
  cream: keyof typeof creams
  pieces: Piece[]
  candle: Candle
}

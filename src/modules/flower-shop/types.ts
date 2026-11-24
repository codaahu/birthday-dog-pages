import type { ModuleContext } from '../../core/story/contract'
import type { flowerMaterials, papers, ribbons } from './config'

export interface ModuleProps {
  context: ModuleContext
}

export type FlowerKind = keyof typeof flowerMaterials
export type Paper = keyof typeof papers
export type Ribbon = keyof typeof ribbons

export interface Stem {
  id: string
  slot: number
  kind: FlowerKind
  color: number
  x: number
  y: number
}

export interface Bouquet {
  id: string
  stems: Stem[]
  paper: Paper
  ribbon: Ribbon
  message: string
}

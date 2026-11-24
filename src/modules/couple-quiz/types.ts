import type { ModuleContext } from '../../core/story/contract'
import type { Photo } from '../../config/photos'

export interface ModuleProps {
  context: ModuleContext
}

export type QuizMood = 'host' | 'think' | 'play' | 'warm' | 'result'
export type OptionId = 'A' | 'B' | 'C' | 'D'

export interface QuizOption {
  id: OptionId
  text: string
  feedback: string
  mood: Exclude<QuizMood, 'host' | 'result'>
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: readonly QuizOption[]
  photoId?: string
}

export interface RoundQuestion extends QuizQuestion {
  photo?: Pick<Photo, 'id' | 'image' | 'title' | 'width' | 'height'>
}

export interface QuizAnswer {
  questionId: string
  option: QuizOption
}

export interface QuizRound {
  id: string
  version: string
  questions: readonly RoundQuestion[]
  answers: readonly QuizAnswer[]
  position: number
}

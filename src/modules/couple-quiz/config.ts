import type { ModuleConfig } from '../../core/story/contract'
import type { QuizQuestion } from './types'

export const config = {
  id: 'couple-quiz', title: '默契问答', accent: 'gold', music: 'play', stage: 4, playable: true,
} satisfies ModuleConfig

export const quizVersion = '2026-11-24.1'

// PRD 已确认的题干、选项与反馈，文案逐条保留
export const confirmedQuestions: readonly QuizQuestion[] = [
  {
    id: 'travel-role', prompt: '和你一起出去旅游，男朋友的主要职责是什么？',
    options: [
      { id: 'A', text: '负责拍照', feedback: '拍到满意为止！', mood: 'warm' },
      { id: 'B', text: '负责拿东西', feedback: '人工行李架已上线！', mood: 'play' },
      { id: 'C', text: '负责规划路线', feedback: '专属导航已就位！', mood: 'think' },
      { id: 'D', text: '以上全部', feedback: '恭喜解锁全能男朋友！', mood: 'play' },
    ],
  },
  {
    id: 'retry-photo', prompt: '如果男朋友拍的照片不好看，应该怎么办？',
    options: [
      { id: 'A', text: '再拍一张', feedback: '好的，收到！', mood: 'warm' },
      { id: 'B', text: '换个角度再拍', feedback: '正在努力寻找角度！', mood: 'think' },
      { id: 'C', text: '拍到满意为止', feedback: '摄影师不敢下班！', mood: 'play' },
      { id: 'D', text: '以上都是', feedback: '小狗表示没有异议！', mood: 'warm' },
    ],
  },
  {
    id: 'birthday-boss', prompt: '今天谁说了算？',
    options: [
      { id: 'A', text: '男朋友', feedback: '回答无效，重新判定为寿星大人！', mood: 'play' },
      { id: 'B', text: '白色小狗', feedback: '白色小狗也听寿星的！', mood: 'warm' },
      { id: 'C', text: '金毛小狗', feedback: '金毛小狗举双手反对！', mood: 'play' },
      { id: 'D', text: '寿星大人', feedback: '完全正确，今日寿星最大！', mood: 'warm' },
    ],
  },
  {
    id: 'weekend-first', prompt: '周末见面之后，第一件事应该做什么？',
    options: [
      { id: 'A', text: '吃好吃的', feedback: '美食正在准备中！', mood: 'warm' },
      { id: 'B', text: '收花花', feedback: '花花等待签收！', mood: 'warm' },
      { id: 'C', text: '拍合照', feedback: '摄影师已经就位！', mood: 'think' },
      { id: 'D', text: '先抱抱', feedback: '抱抱预约成功！', mood: 'warm' },
    ],
  },
]

// 确认新内容后可追加 2–4 道，带 photoId 的题只在照片可用时加入
export const extraQuizQuestions: readonly QuizQuestion[] = []

export const quizCopy = {
  title: '小狗默契大挑战',
  affinity: '默契度',
  result: '天生一对',
  verdict: '本次考试最终解释权归寿星大人所有。',
} as const

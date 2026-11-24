import type { ModuleConfig } from '../../core/story/contract'
import type { QuizQuestion } from './types'

export const config = {
  id: 'couple-quiz', title: '默契问答', accent: 'gold', music: 'play', stage: 4, playable: true,
} satisfies ModuleConfig

export const quizVersion = 'demo.1'

// 公开演示版的四道派对问答
export const confirmedQuestions: readonly QuizQuestion[] = [
  {
    id: 'travel-role', prompt: '生日派对的小狗助手可以做什么？',
    options: [
      { id: 'A', text: '负责拍照', feedback: '拍到满意为止！', mood: 'warm' },
      { id: 'B', text: '负责搬礼物', feedback: '礼物搬运员已就位！', mood: 'play' },
      { id: 'C', text: '负责布置会场', feedback: '彩旗已经挂好啦！', mood: 'think' },
      { id: 'D', text: '以上全部', feedback: '恭喜解锁全能派对助手！', mood: 'play' },
    ],
  },
  {
    id: 'retry-photo', prompt: '派对纪念照拍糊了，应该怎么办？',
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
      { id: 'A', text: '派对助手', feedback: '回答无效，重新判定为寿星大人！', mood: 'play' },
      { id: 'B', text: '白色小狗', feedback: '白色小狗也听寿星的！', mood: 'warm' },
      { id: 'C', text: '金毛小狗', feedback: '金毛小狗举双手反对！', mood: 'play' },
      { id: 'D', text: '寿星大人', feedback: '完全正确，今日寿星最大！', mood: 'warm' },
    ],
  },
  {
    id: 'weekend-first', prompt: '到达小狗派对后，你想先做什么？',
    options: [
      { id: 'A', text: '吃好吃的', feedback: '美食正在准备中！', mood: 'warm' },
      { id: 'B', text: '收花花', feedback: '花花等待签收！', mood: 'warm' },
      { id: 'C', text: '拍纪念照', feedback: '摄影师已经就位！', mood: 'think' },
      { id: 'D', text: '和小狗击掌', feedback: '击掌成功！', mood: 'warm' },
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

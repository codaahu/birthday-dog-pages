export const storyFlow = ['opening', 'memory-room', 'flower-shop', 'cake-shop', 'catch-gifts', 'couple-quiz', 'gashapon', 'meeting', 'ending'] as const
export const moduleIds = [...storyFlow, 'collection'] as const

export type StoryStep = typeof storyFlow[number]
export type ModuleId = typeof moduleIds[number]
export type ChapterId = 'memory' | 'flower' | 'cake' | 'playground' | 'gashapon' | 'meeting'
export type Mode = 'story' | 'collection' | 'dev'

export const chapters = [
  { id: 'memory', title: '回忆小屋', steps: ['memory-room'], coins: 1 },
  { id: 'flower', title: '小狗花店', steps: ['flower-shop'], coins: 1 },
  { id: 'cake', title: '生日蛋糕屋', steps: ['cake-shop'], coins: 1 },
  { id: 'playground', title: '快乐游乐场', steps: ['catch-gifts', 'couple-quiz'], coins: 1 },
  { id: 'gashapon', title: '小狗扭蛋铺', steps: ['gashapon'], coins: 0 },
  { id: 'meeting', title: '周末见面站', steps: ['meeting'], coins: 0 },
] as const satisfies readonly { id: ChapterId; title: string; steps: readonly StoryStep[]; coins: number }[]

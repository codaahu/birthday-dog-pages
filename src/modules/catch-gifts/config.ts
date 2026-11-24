import type { ModuleConfig } from '../../core/story/contract'

export const config = {
  id: 'catch-gifts', title: '接礼物', accent: 'blue', music: 'play', stage: 4, playable: true,
} satisfies ModuleConfig

export const roundMs = 30_000
export const field = { width: 360, height: 384, catchY: 316, basketHalf: 34, edge: 42, propRadius: 12 }

export const giftKinds = {
  flower: { name: '鲜花', points: 10 },
  berry: { name: '草莓', points: 10 },
  cake: { name: '蛋糕', points: 20 },
  kiss: { name: '亲亲', points: 30 },
  gift: { name: '礼物', points: 50 },
  letter: { name: '情书', points: 30 },
  work: { name: '工作消息', points: -10, reply: '今天不许工作汪！' },
  worry: { name: '烦恼', points: -10, reply: '这个不要，帮你扔掉。' },
} as const

export type GiftKind = keyof typeof giftKinds

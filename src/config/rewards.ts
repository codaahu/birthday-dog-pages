import { personal } from './personal'

export const ordinaryTickets = [
  { type: 'hug', name: '无条件抱抱券', rarity: 'R', description: '一个抱抱' },
  { type: 'milk-tea', name: '奶茶自由券', rarity: 'R', description: '一杯奶茶' },
  { type: 'food-choice', name: '美食决定权券', rarity: 'R', description: '安排美食' },
  { type: 'photographer', name: '专属摄影师券', rarity: 'R', description: '拍到满意' },
  { type: 'travel-plan', name: '懒人出行券', rarity: 'SR', description: '攻略路线订票' },
  { type: 'date-choice', name: '周末活动决定权', rarity: 'SR', description: '寿星挑选派对活动' },
  { type: 'wish', name: '小愿望实现券', rarity: 'SR', description: '合理小愿望' },
  { type: 'surprise', name: '神秘惊喜券', rarity: 'SR', description: '内容保密' },
] as const

export const weekendTicket = {
  type: 'weekend-meeting', name: '周末见面券', rarity: 'SSR', description: '派对剧情纪念券',
  validUntil: personal.meetingAt,
} as const

export type TicketType = typeof ordinaryTickets[number]['type'] | typeof weekendTicket.type

export const catchTitles = [
  { minimum: 0, title: '今天也很可爱' },
  { minimum: 80, title: '快乐捕手' },
  { minimum: 150, title: '礼物收割机' },
  { minimum: 250, title: '寿星超神' },
] as const

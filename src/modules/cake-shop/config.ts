import type { ModuleConfig } from '../../core/story/contract'

export const config = {
  id: 'cake-shop', title: '生日蛋糕屋', accent: 'pink', music: 'wish', stage: 3, playable: true,
} satisfies ModuleConfig

export const spongeKinds = {
  vanilla: { label: '原味', color: '#eac68a', stripe: '#f6ddaa' },
  chocolate: { label: '巧克力', color: '#996a56', stripe: '#c28b70' },
  matcha: { label: '抹茶', color: '#a9bd80', stripe: '#c6d3a3' },
  crepe: { label: '千层', color: '#e8af76', stripe: '#f5d6a5' },
} as const

export const creams = {
  white: { label: '原味白', color: '#fff3e3', shadow: '#f1d5b8' },
  pink: { label: '草莓粉', color: '#f4c6cc', shadow: '#e9a5b2' },
  yellow: { label: '奶黄', color: '#f6df99', shadow: '#e4c274' },
  lilac: { label: '香芋紫', color: '#e2cdef', shadow: '#c6add9' },
} as const

export const fruitKinds = {
  strawberry: '草莓', mango: '芒果', blueberry: '蓝莓', cherry: '车厘子', kiwi: '奇异果',
} as const

export const ornamentKinds = { heart: '爱心', star: '星星', bow: '蝴蝶结', dog: '线条小狗插牌' } as const
export const pieceNames = { ...fruitKinds, ...ornamentKinds }
export const maxPieces = 12
export const scaleMin = 65
export const scaleMax = 150
export const wishCopy = {
  title: '闭上眼睛，偷偷许个愿吧',
  message: '愿你新的一岁，有很多很多喜欢的事情发生。',
  finished: '愿望留在心里。生日快乐！',
} as const

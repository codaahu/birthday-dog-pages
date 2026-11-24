import type { ModuleConfig } from '../../core/story/contract'

export const config = {
  id: 'flower-shop', title: '小狗花店', accent: 'green', music: 'gentle', stage: 3, playable: true,
} satisfies ModuleConfig

export const flowerMaterials = {
  tulip: { name: '郁金香', colors: ['#e999aa', '#f4ce77', '#c2a8dc'] },
  lisianthus: { name: '洋桔梗', colors: ['#f0d4df', '#e3d5ef', '#fff1d1'] },
  daisy: { name: '小雏菊', colors: ['#fff7df', '#f5bbb8', '#d9d7ef'] },
  sunflower: { name: '向日葵', colors: ['#f0bf59', '#e89b55'] },
  rose: { name: '玫瑰', colors: ['#df8391', '#eab8bd', '#dc9e76'] },
  hydrangea: { name: '绣球', colors: ['#9fb6df', '#b9a4d9', '#e4a5bc'] },
  gypsophila: { name: '满天星', colors: ['#fff7df', '#efb6c4', '#c9b6e2'] },
  eucalyptus: { name: '尤加利', colors: ['#9bb69d', '#80a9a2'] },
} as const

export const papers = {
  kraft: { name: '牛皮纸', color: '#d7b484', shade: '#bb9264' },
  ivory: { name: '奶油白', color: '#fff0d4', shade: '#e5cba7' },
  green: { name: '浅绿', color: '#dce6d4', shade: '#b6c8ae' },
  lilac: { name: '淡紫', color: '#e5d9ed', shade: '#c6b1d7' },
} as const

export const ribbons = {
  pink: { name: '粉色', color: '#e6a4b1' },
  green: { name: '绿色', color: '#a9c3a3' },
  purple: { name: '紫色', color: '#b69bcc' },
  yellow: { name: '黄色', color: '#eac36c' },
} as const

export const cardMessages = ['生日快乐呀！', '今天的花花送给你。', '祝今天的派对玩得开心！']
export const flowerNotes = {
  eucalyptus: '这个负责让花束看起来很贵汪。',
  rose: '这枝玫瑰，替你先说一句喜欢。',
  sunflower: '今天的阳光，给花束留一点。',
} as const

export const minStems = 3
export const maxStems = 9
export const cardLength = 42

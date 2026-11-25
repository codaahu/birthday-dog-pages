import type { AchievementId } from '../../config/achievements'

// 图鉴只为每个成就保留一个分组，凑齐花束和蛋糕归入冒险纪念
export const achievementGroups = [
  { id: 'flowers', title: '小狗花店', ids: ['florist', 'flower-family', 'sunflower-bouquet', 'nine-roses'] },
  { id: 'cakes', title: '生日蛋糕屋', ids: ['pastry', 'fruit-cake', 'matcha-cake', 'dog-cake'] },
  { id: 'opening', title: '开场', ids: ['dog-petting'] },
  { id: 'memory', title: '回忆小屋', ids: [
    'memory-collector', 'memory-detective', 'food-radar', 'memory-restorer', 'room-observer', 'funny-album', 'pet-discovery',
  ] },
  { id: 'catch', title: '接礼物挑战', ids: ['catcher', 'gift-harvester', 'birthday-warrior', 'no-overtime', 'boyfriend-letters', 'workaholic'] },
  { id: 'quiz', title: '默契问答', ids: [
    'quiz-all-duties', 'quiz-birthday-hug', 'quiz-all-d', 'quiz-photographer', 'quiz-food-first', 'quiz-golden-boss', 'quiz-all-c',
  ] },
  { id: 'tickets', title: '扭蛋与兑换券', ids: ['nine-capsules', 'hug-delivered'] },
  { id: 'adventure', title: '冒险纪念', ids: ['birthday-star', 'flowers-and-cake', 'second-birthday'] },
] as const satisfies readonly { id: string; title: string; ids: readonly AchievementId[] }[]

// 老成就保留原判定，仅补齐图鉴查看时显示的条件
export const legacyConditions: Partial<Record<AchievementId, string>> = {
  'dog-petting': '在开场摸小狗 10 次，或在回忆小屋连续摸玩偶 5 次',
  'funny-album': '在回忆小屋发现搞怪相册，并完成隐藏对话',
  'memory-collector': '完成一次合照拼图',
  'memory-detective': '探索回忆小屋的全部主要物件',
  'food-radar': '探索回忆小屋的全部美食相关物件',
  'pet-discovery': '打开回忆小屋玩偶后面的狗狗秘密相册',
  'memory-restorer': '完成一次合照拼图',
  'room-observer': '探索回忆小屋的全部可点击物件',
  florist: '在小狗花店包好一束花',
  pastry: '在生日蛋糕屋做好一份蛋糕并吹灭蜡烛',
  catcher: '完成一局接礼物挑战',
  'gift-harvester': '在一局接礼物挑战中获得至少 200 分',
  'birthday-warrior': '在一局接礼物挑战中获得至少 300 分',
  'birthday-star': '第一次完成生日冒险，并进入生日小屋',
}

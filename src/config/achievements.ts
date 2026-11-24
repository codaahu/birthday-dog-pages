export const achievementNames = {
  'dog-petting': '摸狗大师',
  'funny-album': '成功抓获男朋友',
  'memory-collector': '回忆收藏家',
  'memory-detective': '回忆侦探',
  'food-radar': '吃货雷达',
  'pet-discovery': '贴贴发现家',
  'memory-restorer': '回忆修复师',
  'room-observer': '小屋观察员',
  florist: '花艺大师',
  pastry: '甜点大师',
  catcher: '快乐捕手',
  'gift-harvester': '礼物收割机',
  'birthday-warrior': '寿星战神',
  'birthday-star': '今日唯一指定寿星',
} as const

export type AchievementId = keyof typeof achievementNames

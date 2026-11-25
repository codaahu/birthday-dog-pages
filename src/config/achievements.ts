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
  'workaholic': '工作狂人',
  'nine-capsules': '九颗蛋，一个约会',
  'no-overtime': '今天不加班',
  'boyfriend-letters': '男朋友来信',
  'flowers-and-cake': '花和蛋糕都归你',
  'hug-delivered': '抱抱已签收',
  'second-birthday': '小金毛带你过两次生日',
  'quiz-all-duties': '小金毛全都要做',
  'quiz-photographer': '摄影师不许下班',
  'quiz-golden-boss': '金毛当家三秒钟',
  'quiz-birthday-hug': '寿星说了算，先抱抱',
  'quiz-food-first': '先吃再说',
  'quiz-all-d': '一路选 D',
  'quiz-all-c': '全选C',
  'flower-family': '花店全家福',
  'sunflower-bouquet': '今天阳光超标',
  'nine-roses': '一大束喜欢',
  'fruit-cake': '水果摊开张',
  'dog-cake': '小狗不够分',
  'matcha-cake': '抹茶脑袋',
} as const

export type AchievementId = keyof typeof achievementNames

interface AchievementCopy {
  condition: string
  message: string
  hidden?: true
}

// 新成就的解锁条件、反馈和隐藏状态
export const achievementCopy: Partial<Record<AchievementId, AchievementCopy>> = {
  'workaholic': {
    condition: '一局至少接到 1 条工作消息，接到的东西全是工作消息',
    message: '寿星大人，您的篮子已被工作群占领。',
    hidden: true,
  },
  'nine-capsules': {
    condition: '累计揭晓 9 种扭蛋券，已兑现的也算',
    message: '九种快乐都收齐啦。最后那个抱抱，见面给你。',
  },
  'no-overtime': {
    condition: '一局接到至少 10 个加分道具，躲开所有工作消息和烦恼',
    message: '快乐照单全收，工作明天再说。',
  },
  'boyfriend-letters': {
    condition: '一局接到至少 3 封情书',
    message: '怎么又是你的小金毛寄来的？',
  },
  'flowers-and-cake': {
    condition: '收藏里至少有一束亲手做的花和一个亲手做的蛋糕',
    message: '花是你挑的，蛋糕是你做的，寿星也是你。',
  },
  'hug-delivered': {
    condition: '兑现一张无条件抱抱券',
    message: '本次配送已完成。小金毛还想再抱一会儿。',
  },
  'second-birthday': {
    condition: '完整通关两轮生日冒险',
    message: '欢迎回来，小伙子。再说一次，生日快乐！',
  },
  'quiz-all-duties': {
    condition: '同一轮答题，旅行职责选「以上全部」，照片不好看选「以上都是」',
    message: '拍照、拎包、带路，小金毛已全部接单。',
  },
  'quiz-photographer': {
    condition: '同一轮答题，照片不好看选「拍到满意为止」，周末见面选「拍合照」',
    message: '好，先来一张。没拍好我们再来一张。',
  },
  'quiz-golden-boss': {
    condition: '在「今天谁说了算？」选「金毛小狗」，并完成本轮问答',
    message: '小金毛刚坐上主位，就被寿星叫去拿蛋糕了。',
    hidden: true,
  },
  'quiz-birthday-hug': {
    condition: '同一轮答题，今天谁说了算选「寿星大人」，周末见面选「先抱抱」',
    message: '收到。今天听你的，抱多久也听你的。',
  },
  'quiz-food-first': {
    condition: '同一轮答题，旅行职责选「负责拿东西」，周末见面选「吃好吃的」',
    message: '包给我。你先看菜单。',
  },
  'quiz-all-d': {
    condition: '同一轮默契问答的四道原题全选 D',
    message: '全能男朋友，照片拍到满意，今天你说了算，见面先抱抱。小金毛全记下了。',
  },
  'quiz-all-c': {
    condition: '同一轮默契问答的四道原题全选 C',
    message: '不会就选 C！恭喜，默契度还是 100%。',
    hidden: true,
  },
  'flower-family': {
    condition: '在同一束成品花束里用齐 8 种花材',
    message: '郁金香到，尤加利到。好，全员到齐，系丝带！',
  },
  'sunflower-bouquet': {
    condition: '包好一束至少 5 枝、全是向日葵的花',
    message: '小金毛抱着这束花，感觉自己也快被晒成金色了。',
  },
  'nine-roses': {
    condition: '包好一束 9 枝玫瑰',
    message: '这次小金毛借了九枝玫瑰，一起说喜欢你。',
    hidden: true,
  },
  'fruit-cake': {
    condition: '同一个蛋糕用齐 5 种水果，再吹灭蜡烛',
    message: '草莓芒果蓝莓车厘子奇异果——小金毛一口气报完了！',
  },
  'dog-cake': {
    condition: '同一个蛋糕插至少 3 个线条小狗插牌，再吹灭蜡烛',
    message: '等等，蛋糕就一个，怎么来了三只小狗？',
    hidden: true,
  },
  'matcha-cake': {
    condition: '做一个抹茶胚、只用奇异果做水果装饰的蛋糕，再吹灭蜡烛',
    message: '小金毛试吃完毕。嘴角是绿的，点头是真的。',
  },
}

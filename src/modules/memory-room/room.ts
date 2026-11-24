import type { AchievementId } from '../../config/achievements'
import type { Photo, PhotoCategory } from '../../config/photos'

// 热区以 1312×1199 场景内的物件边界归一化坐标定位
export const mainHotspots = [
  { id: 'couple', label: '墙上相框', x: 29, y: 19, w: 13, h: 13 },
  { id: 'portrait', label: '相机和日历', x: 10, y: 37, w: 24, h: 20 },
  { id: 'puzzle', label: '复古电视', x: 25, y: 58.8, w: 22, h: 13.5 },
  { id: 'shelf', label: '右侧书架', x: 59, y: 33.7, w: 23, h: 15.5 },
  { id: 'daily', label: '前景餐桌', x: 52, y: 77, w: 9.8, h: 10.9 },
  { id: 'dogs', label: '小白和小金毛玩偶', x: 59.5, y: 48.6, w: 25, h: 19 },
] as const

// 每个独立餐盘与每瓶或每杯饮料分别累计
export const foodHotspots = [
  { id: 'food-pizza', label: '披萨盒', x: 9.5, y: 72, w: 17.8, h: 13.4, meal: true },
  { id: 'food-skewers', label: '烤串托盘', x: 27.5, y: 74.6, w: 23.4, h: 12.5, meal: true },
  { id: 'food-bento', label: '餐盒里的卷寿司', x: 57, y: 67.6, w: 8.5, h: 7.7, meal: true },
  { id: 'food-fried', label: '炸物碗', x: 62.4, y: 73.9, w: 10.8, h: 8.6, meal: true },
  { id: 'food-dessert', label: '橙色甜点', x: 73.7, y: 79, w: 8.4, h: 8.1, meal: true },
  { id: 'drink-shelf-left', label: '书架上的黄色小瓶', x: 60.7, y: 23, w: 4.2, h: 10.2, meal: false },
  { id: 'drink-shelf-middle', label: '书架上的粉色小瓶', x: 65.5, y: 23, w: 4.2, h: 10.2, meal: false },
  { id: 'drink-shelf-green', label: '书架上的浅绿高瓶', x: 70.1, y: 17.8, w: 4.4, h: 11.5, meal: false },
  { id: 'drink-shelf-red', label: '书架上的红色高瓶', x: 75.3, y: 16.8, w: 4.9, h: 15.5, meal: false },
  { id: 'drink-tv-left', label: '电视旁左边的玻璃瓶', x: 25.7, y: 49.6, w: 4.8, h: 9.4, meal: false },
  { id: 'drink-tv-right', label: '电视旁右边的玻璃瓶', x: 30.7, y: 48.4, w: 4.8, h: 9.7, meal: false },
  { id: 'drink-juice', label: '餐盒旁黄色小饮料', x: 52.8, y: 66.6, w: 4.2, h: 6.1, meal: false },
  { id: 'drink-table-bottle', label: '餐桌上的绿玻璃瓶', x: 68.5, y: 63.2, w: 4.9, h: 9.2, meal: false },
  { id: 'drink-orange-cup', label: '橙色饮料杯', x: 81.3, y: 73.8, w: 5.1, h: 6.1, meal: false },
  { id: 'drink-green-cup', label: '绿色饮料杯', x: 83.5, y: 80.2, w: 5.9, h: 6.3, meal: false },
] as const

export const hotspots = [...mainHotspots, ...foodHotspots] as const
export type HotspotId = typeof hotspots[number]['id']
export type AlbumCategory = Exclude<PhotoCategory, 'puzzle'>

export const albumTitles: Record<AlbumCategory, string> = {
  couple: '合照相册',
  portrait: '专属摄影展',
  travel: '旅行手账',
  daily: '日常与美食',
  engagement: '订婚纪念',
  funny: '搞怪相册',
  pet: '狗狗秘密相册',
}

const normalAlbums = ['couple', 'portrait', 'engagement', 'travel', 'daily'] as const
export const mainMemoryPoints = mainHotspots.filter((spot) => spot.id !== 'dogs')
export const requiredPetTaps = 5

/**
 * 取有内容的普通相册分类
 *
 * @date 2026/11/24 11:23
 * @param photos 当前素材清单中的照片
 * @return 可计入探索目标的相册分类
 */
export function availableAlbums(photos: Photo[]) {
  return normalAlbums.filter((category) => photos.some((photo) => photo.category === category))
}

/**
 * 计算本轮探索目标和完成条件
 *
 * @date 2026/11/24 11:23
 * @param available 当前有照片的相册分类
 * @param explored 本轮已探索的相册分类
 * @param puzzleFinal 是否已有拼图完成或跳过记录
 * @return 目标、已探索数量与是否可以继续
 */
export function roomProgress(available: readonly AlbumCategory[], explored: readonly AlbumCategory[], puzzleFinal: boolean) {
  const target = Math.min(3, available.length)
  const count = available.filter((category) => explored.includes(category)).length
  return { target, count, ready: count >= target && puzzleFinal }
}

/**
 * 优先使用专门的拼图素材，否则使用合照
 *
 * @date 2026/11/24 11:23
 * @param photos 当前素材清单中的照片
 * @return 可用于拼图的照片
 */
export function puzzlePhotos(photos: Photo[]) {
  const selected = photos.filter((photo) => photo.category === 'puzzle')
  return selected.length ? selected : photos.filter((photo) => photo.category === 'couple')
}

/**
 * 从本轮已触发的物件与连续触摸次数判断探索成就
 *
 * @date 2026/11/24 13:54
 * @param visits 已发现的物件 ID，可含重复点击
 * @param petTaps 连续点击玩偶次数
 * @return 已达到条件的成就 ID
 */
export function roomDiscoveryAchievements(visits: readonly HotspotId[], petTaps: number): AchievementId[] {
  const visited = new Set(visits)
  const earned: AchievementId[] = []
  if (mainMemoryPoints.every(({ id }) => visited.has(id))) {
    earned.push('memory-detective')
  }
  if (foodHotspots.every(({ id }) => visited.has(id))) {
    earned.push('food-radar')
  }
  if (petTaps >= requiredPetTaps) {
    earned.push('dog-petting')
  }
  if (hotspots.every(({ id }) => visited.has(id))) {
    earned.push('room-observer')
  }
  return earned
}

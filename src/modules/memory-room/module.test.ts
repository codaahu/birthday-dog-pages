import { describe, expect, it } from 'vitest'
import { moduleIds } from '../../config/storyFlow'
import { config } from './config'
import Module from './Module.vue'
import type { Photo, PhotoCategory } from '../../config/photos'
import { isSolved, shuffledTiles, swapTiles } from './puzzle'
import { availableAlbums, foodHotspots, hotspots, mainHotspots, mainMemoryPoints, puzzlePhotos, roomDiscoveryAchievements, roomProgress } from './room'

/**
 * 创建一张测试照片
 *
 * @date 2026/11/24 11:32
 * @param category 测试使用的相册分类
 * @return 具有稳定 ID 的虚拟照片记录
 */
function photo(category: PhotoCategory): Photo {
  return { id: category, category, image: '', thumbnail: '', width: 1, height: 1 }
}

describe('回忆小屋', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('memory-room')
    expect(Module).toBeDefined()
  })

  it('空相册须记录拼图跳过，单照片只须探索一个相册', () => {
    expect(roomProgress(availableAlbums([]), [], false)).toEqual({ count: 0, target: 0, ready: false })
    expect(roomProgress(availableAlbums([]), [], true).ready).toBe(true)
    const one = [photo('couple')]
    expect(puzzlePhotos(one)).toEqual(one)
    expect(roomProgress(availableAlbums(one), ['couple'], true)).toEqual({ count: 1, target: 1, ready: true })
  })

  it('多相册只要求探索三个普通分类，单独拼图素材优先', () => {
    const photos = ['couple', 'portrait', 'travel', 'engagement', 'daily', 'funny', 'puzzle', 'pet']
      .map((category) => photo(category as PhotoCategory))
    const available = availableAlbums(photos)
    expect(puzzlePhotos(photos).map((item) => item.id)).toEqual(['puzzle'])
    expect(available).not.toContain('pet')
    expect(roomProgress(available, ['funny', 'couple', 'daily'], true).ready).toBe(false)
    expect(roomProgress(available, ['daily', 'portrait', 'travel'], true)).toEqual({ count: 3, target: 3, ready: true })
  })

  it('所有主物件和食物热区均有唯一 ID 且落在成图内', () => {
    expect(mainHotspots).toHaveLength(6)
    expect(new Set(hotspots.map((spot) => spot.id)).size).toBe(hotspots.length)
    expect(hotspots.every((spot) => spot.x > 0 && spot.x + spot.w < 100 && spot.y > 0 && spot.y + spot.h < 100)).toBe(true)
  })

  it('按独立物件解锁成就，重复点击同一处不会充数', () => {
    const main = mainMemoryPoints.map(({ id }) => id)
    const food = foodHotspots.map(({ id }) => id)
    const all = hotspots.map(({ id }) => id)
    expect(roomDiscoveryAchievements(['couple', 'couple', 'dogs'], 4)).toEqual([])
    expect(roomDiscoveryAchievements(main, 0)).toEqual(['memory-detective'])
    expect(roomDiscoveryAchievements(food, 0)).toEqual(['food-radar'])
    expect(roomDiscoveryAchievements(['dogs'], 5)).toEqual(['dog-petting'])
    expect(roomDiscoveryAchievements(all, 5)).toEqual(['memory-detective', 'food-radar', 'dog-petting', 'room-observer'])
  })

  it('初始排布可解，交换相同位置不会累计次数', () => {
    const tiles = shuffledTiles(() => 0)
    expect(new Set(tiles).size).toBe(9)
    expect(isSolved(tiles)).toBe(false)
    const puzzle = { id: 'test', photoId: 'couple', moves: 0, timeMs: 100, tiles }
    expect(swapTiles(puzzle, 0, 0)).toBe(puzzle)
    const fixed = swapTiles(puzzle, 0, 1)
    expect(isSolved(fixed.tiles)).toBe(true)
    expect(fixed.moves).toBe(1)
  })
})

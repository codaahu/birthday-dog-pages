import { describe, expect, it } from 'vitest'
import { moduleIds } from '../../config/storyFlow'
import { config } from './config'
import Module from './Module.vue'
import { addStem, bouquetList, bouquetOrder, isPackable, newBouquet, stemPosition } from './bouquet'

describe('小狗花店', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('flower-shop')
    expect(Module).toBeDefined()
  })

  it('要求 3 到 9 枝，允许重复花材并保留不同枝 ID', () => {
    let bouquet = newBouquet()
    for (let count = 0; count < 3; count += 1) {
      expect(isPackable(bouquet)).toBe(false)
      bouquet = addStem(bouquet, 'rose', 1)
    }
    expect(isPackable(bouquet)).toBe(true)
    expect(bouquetList(bouquet)).toContain('玫瑰（#EAB8BD） × 3 枝')
    expect(new Set(bouquet.stems.map((stem) => stem.id)).size).toBe(3)
    for (let count = 3; count < 9; count += 1) {
      bouquet = addStem(bouquet, 'eucalyptus', 0)
    }
    expect(addStem(bouquet, 'tulip', 0)).toBe(bouquet)
    expect(isPackable(bouquet)).toBe(true)
  })

  it('复用删除位置，保持其他花枝布局与原订单号', () => {
    const first = addStem(newBouquet(), 'tulip', 0)
    const second = addStem(first, 'daisy', 0)
    const retained = second.stems[1]
    const restored = addStem({ ...second, stems: [retained] }, 'rose', 2)
    expect(restored.stems[0]).toBe(retained)
    expect(restored.stems[1].slot).toBe(first.stems[0].slot)
    expect(bouquetOrder(restored)).toMatchObject({ number: bouquetOrder(first).number, total: '¥0.00' })
    expect(bouquetOrder(newBouquet()).number).not.toBe(bouquetOrder(first).number)
    expect(stemPosition({ x: -20, y: 300 })).toEqual({ x: 51, y: 184 })
  })
})

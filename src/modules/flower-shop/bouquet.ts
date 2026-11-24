import { personal } from '../../config/personal'
import { newId } from '../../core/storage/id'
import type { ArtworkPoint } from '../../shared/studio/useArtworkDrag'
import { flowerMaterials, maxStems, minStems, papers, ribbons } from './config'
import type { Bouquet, FlowerKind, Stem } from './types'

// 初始花位从中心向两侧展开，删除后可以复用空位
const slots: readonly ArtworkPoint[] = [
  { x: 176, y: 77 }, { x: 121, y: 128 }, { x: 227, y: 121 },
  { x: 86, y: 158 }, { x: 270, y: 158 }, { x: 133, y: 67 },
  { x: 226, y: 65 }, { x: 149, y: 152 }, { x: 202, y: 158 },
]

/**
 * 创建空白花束并预先分配唯一订单对应的作品 ID
 *
 * @date 2026/11/24 11:47
 * @return 可编辑草稿
 */
export function newBouquet(): Bouquet {
  return { id: newId(), stems: [], paper: 'kraft', ribbon: 'pink', message: '' }
}

/**
 * 将一枝花自动放入空位置
 *
 * @date 2026/11/24 11:47
 * @param bouquet 当前花束
 * @param kind 已选择的花材
 * @param color 花材的颜色索引
 * @return 新花束，达到上限时返回原花束
 */
export function addStem(bouquet: Bouquet, kind: FlowerKind, color: number): Bouquet {
  if (bouquet.stems.length >= maxStems) {
    return bouquet
  }
  const slot = slots.findIndex((_point, index) => !bouquet.stems.some((stem) => stem.slot === index))
  const stem: Stem = { id: newId(), slot, kind, color, ...slots[slot] }
  return { ...bouquet, stems: [...bouquet.stems, stem] }
}

/**
 * 限制拖动位置，保留每枝花的完整花冠
 *
 * @date 2026/11/24 11:47
 * @param point 花束画布坐标
 * @return 可用范围内的坐标
 */
export function stemPosition(point: ArtworkPoint) {
  return {
    x: Math.round(Math.min(309, Math.max(51, point.x))),
    y: Math.round(Math.min(184, Math.max(42, point.y))),
  }
}

/**
 * 判断当前花束是否可以包装
 *
 * @date 2026/11/24 11:47
 * @param bouquet 当前花束
 * @return 花材数量处于约定范围时为 true
 */
export function isPackable(bouquet: Bouquet) {
  return bouquet.stems.length >= minStems && bouquet.stems.length <= maxStems
}

/**
 * 生成虚拟订单快照
 *
 * @date 2026/11/24 11:47
 * @param bouquet 已完成搭配的花束
 * @return 虚拟订单号、收件人、金额、配送与状态
 */
export function bouquetOrder(bouquet: Bouquet) {
  return {
    number: 'FLOWER-' + bouquet.id.slice(0, 12).toUpperCase(),
    recipient: personal.recipient[0],
    item: '亲手搭配的生日花束 × 1',
    total: '¥0.00',
    delivery: '本周末配送',
    payment: '一个抱抱支付',
    status: '已接单，等待小狗配送',
  }
}

/**
 * 按花材和颜色合并相同条目，供用户复制清单
 *
 * @date 2026/11/24 11:47
 * @param bouquet 已保存的花束
 * @return 可直接粘贴的多行文本
 */
export function bouquetList(bouquet: Bouquet) {
  const counts = new Map<string, number>()
  for (const stem of bouquet.stems) {
    const material = flowerMaterials[stem.kind]
    const label = material.name + '（' + material.colors[stem.color].toUpperCase() + '）'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  const items = [...counts].map(([name, count]) => name + ' × ' + count + ' 枝')
  items.push('包装：' + papers[bouquet.paper].name, '丝带：' + ribbons[bouquet.ribbon].name)
  if (bouquet.message.trim()) {
    items.push('贺卡：' + bouquet.message.trim())
  }
  return items.join('\n')
}

import { newId } from '../../core/storage/id'
import type { ArtworkPoint } from '../../shared/studio/useArtworkDrag'
import { maxPieces, scaleMax, scaleMin } from './config'
import type { Cake, CakePhase, Candle, Piece, PieceKind } from './types'

// 装饰先沿蛋糕面四周排列，留出中间的蜡烛位置
const slots: readonly ArtworkPoint[] = [
  { x: 110, y: 175 }, { x: 244, y: 175 }, { x: 141, y: 202 }, { x: 217, y: 203 },
  { x: 180, y: 209 }, { x: 129, y: 158 }, { x: 225, y: 157 }, { x: 166, y: 151 },
  { x: 194, y: 151 }, { x: 96, y: 188 }, { x: 259, y: 187 }, { x: 180, y: 190 },
]

/** 创建新的生日蛋糕草稿
 * @date 2026/11/24 11:51
 * @return 默认原味蛋糕，年龄留空
 */
export function newCake(): Cake {
  return { id: newId(), sponge: 'vanilla', cream: 'white', pieces: [], candle: { kind: 'plain' } }
}

/** 在第一处空位添加装饰
 * @date 2026/11/24 11:51
 * @param cake 当前蛋糕快照
 * @param kind 装饰类型
 * @return 添加后的快照，达到上限时返回原快照
 */
export function addPiece(cake: Cake, kind: PieceKind): Cake {
  if (cake.pieces.length >= maxPieces) {
    return cake
  }
  const slot = slots.findIndex((_point, index) => !cake.pieces.some((piece) => piece.slot === index))
  const piece: Piece = { id: newId(), slot, kind, ...slots[slot], angle: 0, scale: 100 }
  return { ...cake, pieces: [...cake.pieces, piece] }
}

/** 把装饰中心限制在蛋糕的椭圆顶面
 * @date 2026/11/24 11:51
 * @param point 画布中的目标坐标
 * @return 投影到顶面内的坐标
 */
export function cakePosition(point: ArtworkPoint) {
  const x = (point.x - 180) / 87
  const y = (point.y - 182) / 34
  const distance = Math.max(1, Math.hypot(x, y))
  return { x: Math.round(180 + x * 87 / distance), y: Math.round(182 + y * 34 / distance) }
}

/** 更新指定装饰的坐标、旋转和缩放
 * @date 2026/11/24 11:51
 * @param cake 当前蛋糕快照
 * @param id 要编辑的装饰 ID
 * @param values 本次修改的属性
 * @return 应用修改的新草稿
 */
export function changePiece(cake: Cake, id: string, values: Partial<Pick<Piece, 'x' | 'y' | 'angle' | 'scale'>>): Cake {
  const pieces = cake.pieces.map((piece) => {
    if (piece.id !== id) {
      return piece
    }
    const next = { ...piece, ...values }
    return {
      ...next, ...cakePosition(next),
      angle: ((next.angle % 360) + 360) % 360,
      scale: Math.min(scaleMax, Math.max(scaleMin, next.scale)),
    }
  })
  return { ...cake, pieces }
}

/** 更新用户输入的数字蜡烛，保留空白直到用户填写
 * @date 2026/11/24 11:51
 * @param raw 输入框原始文本
 * @return 最多两位用户输入数字
 */
export function candleDigits(raw: string) {
  return raw.replace(/[^0-9]/g, '').slice(0, 2)
}

/** 判断当前蜡烛是否可插入
 * @date 2026/11/24 11:51
 * @param candle 用户选择的蜡烛
 * @return 普通蜡烛或有效的数字蜡烛
 */
export function canInsert(candle: Candle) {
  return candle.kind === 'plain' || /^\d{1,2}$/.test(candle.digits)
}

/** 恢复可以安全继续的阶段，许愿中断时回到未点亮状态
 * @date 2026/11/24 11:51
 * @param stored 草稿记录的阶段
 * @return 当前显示的阶段
 */
export function resumePhase(stored: unknown): CakePhase {
  if (stored === 'served') {
    return stored
  }
  if (stored === 'candles' || stored === 'wish') {
    return 'candles'
  }
  return 'editing'
}

import type { AchievementId } from '../../config/achievements'
import { field, giftKinds, roundMs, type GiftKind } from './config'

export interface FallingGift { id: number; kind: GiftKind; x: number; born: number }
export interface VisibleGift extends FallingGift { y: number }
export interface CatchTotals { score: number; gifts: number; troubles: number }
export interface Round extends CatchTotals {
  elapsed: number
  basket: number
  cursor: number
  visible: VisibleGift[]
  hit?: { gift: VisibleGift; at: number }
}

export const emptyRound: Round = {
  elapsed: 0, basket: field.width / 2, cursor: 0, visible: [], score: 0, gifts: 0, troubles: 0,
}

// 补充普通礼物的比重，并控制高分礼物出现频率
const deck: readonly GiftKind[] = [
  'flower', 'berry', 'cake', 'kiss', 'gift', 'letter', 'work', 'worry', 'flower', 'cake', 'work', 'gift',
]

/**
 * 预生成整局掉落顺序，计时快慢不会改变道具总数或种类
 *
 * @date 2026/11/24 16:01
 * @param random 取 0 到 1 之间随机值，测试可固定
 * @return 按出现时间排序的掉落道具
 */
export function giftPlan(random = Math.random): FallingGift[] {
  const plan: FallingGift[] = []
  const bag: GiftKind[] = []
  let lane: number | undefined
  for (let born = 120; born < roundMs - 1350; born += 925 - 335 * born / roundMs) {
    if (!bag.length) {
      bag.push(...deck)
    }
    // 避免同一横向位置连续刷出道具
    const roll = Math.floor(random() * (lane === undefined ? 6 : 5))
    lane = lane !== undefined && roll >= lane ? roll + 1 : roll
    const [kind] = bag.splice(Math.floor(random() * bag.length), 1)
    plan.push({ id: plan.length, kind, x: 40 + lane * 56, born })
  }
  return plan
}

/**
 * 随时间连续加速，计算道具在指定时刻的画布纵坐标
 *
 * @date 2026/11/24 16:01
 * @param gift 掉落物的配置和出现时间
 * @param time 开局后已过的活动毫秒数
 * @return 画布中的纵坐标
 */
export function giftY(gift: FallingGift, time: number) {
  const age = Math.max(0, time - gift.born) / 1000
  const acceleration = 4.2
  const startingSpeed = 132 + acceleration * gift.born / 1000
  return -17 + startingSpeed * age + acceleration * age ** 2 / 2
}

/**
 * 计算道具穿过篮口的精确时间，避免低帧率跨过碰撞区域
 *
 * @date 2026/11/24 16:01
 * @param gift 从画布上方掉落的道具
 * @return 篮口交叉时间，以活动毫秒数表示
 */
function crossesAt(gift: FallingGift) {
  const speed = 132 + 4.2 * gift.born / 1000
  const length = field.catchY + 17
  const seconds = 2 * length / (speed + Math.sqrt(speed ** 2 + 2 * 4.2 * length))
  return gift.born + seconds * 1000
}

/**
 * 将篮心限制在场地边缘内，保留完整篮子
 *
 * @date 2026/11/24 16:01
 * @param x 玩家请求的横坐标
 * @return 可用的篮心横坐标
 */
export function basketX(x: number) {
  return Math.max(field.edge, Math.min(field.width - field.edge, x))
}

/**
 * 推进画面到下一活动时刻，按穿过篮口时的位置判定并累计本局成绩
 *
 * @date 2026/11/24 16:01
 * @param previous 上一帧的状态
 * @param plan 本局预生成的掉落顺序
 * @param elapsed 下一帧的活动时间
 * @param position 下一帧的篮心横坐标
 * @return 更新后的场地和成绩
 */
export function advanceRound(previous: Round, plan: readonly FallingGift[], elapsed: number, position: number): Round {
  const time = Math.max(previous.elapsed, Math.min(roundMs, elapsed))
  const basket = basketX(position)
  const next: Round = { ...previous, elapsed: time, basket, visible: [] }
  const candidates: FallingGift[] = [...previous.visible]
  while (next.cursor < plan.length && plan[next.cursor].born <= time) {
    candidates.push(plan[next.cursor++])
  }

  for (const gift of candidates) {
    const y = giftY(gift, time)
    if (y >= field.catchY && giftY(gift, previous.elapsed) < field.catchY) {
      const at = crossesAt(gift)
      const portion = (at - previous.elapsed) / (time - previous.elapsed)
      const x = previous.basket + (basket - previous.basket) * portion
      if (Math.abs(x - gift.x) <= field.basketHalf + field.propRadius) {
        const { points } = giftKinds[gift.kind]
        next.score = Math.max(0, next.score + points)
        next.gifts += Number(points > 0)
        next.troubles += Number(points < 0)
        next.hit = { gift: { ...gift, y: field.catchY }, at }
        continue
      }
    }
    if (y < field.height + 24) {
      next.visible.push({ ...gift, y })
    }
  }
  return next
}

/**
 * 把最终分数映射为游乐场结算称号
 *
 * @date 2026/11/24 16:01
 * @param score 本局分数，最低为零
 * @return 按 PRD 分段的称号
 */
export function catchTitle(score: number) {
  if (score >= 250) {
    return '寿星超神'
  }
  if (score >= 150) {
    return '礼物收割机'
  }
  if (score >= 80) {
    return '快乐捕手'
  }
  return '今天也很可爱'
}

/**
 * 确定本局分数达到的永久成就
 *
 * @date 2026/11/24 16:01
 * @param score 完成 30 秒时的分数
 * @return 本局满足条件的成就 ID
 */
export function catchAwards(score: number): readonly AchievementId[] {
  if (score >= 300) {
    return ['catcher', 'gift-harvester', 'birthday-warrior']
  }
  if (score >= 200) {
    return ['catcher', 'gift-harvester']
  }
  return ['catcher']
}

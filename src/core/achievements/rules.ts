import type { AchievementId } from '../../config/achievements'
import { ordinaryTickets, weekendTicket } from '../../config/rewards'
import type { Draw, GameResult, Snapshot, Ticket, Work } from '../storage/types'

const flowers = ['tulip', 'lisianthus', 'daisy', 'sunflower', 'rose', 'hydrangea', 'gypsophila', 'eucalyptus']
const fruits = ['strawberry', 'mango', 'blueberry', 'cherry', 'kiwi']
const ticketTypes = [...ordinaryTickets, weekendTicket].map(({ type }) => type)

// 以原题 ID 匹配旧快照，扩展题和题目排序不影响判定
const quizRules = [
  { id: 'quiz-all-duties', answers: { 'travel-role': 'D', 'retry-photo': 'D' } },
  { id: 'quiz-photographer', answers: { 'retry-photo': 'C', 'weekend-first': 'C' } },
  { id: 'quiz-golden-boss', answers: { 'birthday-boss': 'C' } },
  { id: 'quiz-birthday-hug', answers: { 'birthday-boss': 'D', 'weekend-first': 'D' } },
  { id: 'quiz-food-first', answers: { 'travel-role': 'B', 'weekend-first': 'A' } },
  { id: 'quiz-all-d', answers: { 'travel-role': 'D', 'retry-photo': 'D', 'birthday-boss': 'D', 'weekend-first': 'D' } },
  { id: 'quiz-all-c', answers: { 'travel-role': 'C', 'retry-photo': 'C', 'birthday-boss': 'C', 'weekend-first': 'C' } },
] as const

/**
 * 根据已完成的接礼物记录或当局统计计算新成就
 *
 * @date 2026/11/25 11:23
 * @param details 礼物和扣分道具总数，旧记录可能没有工作消息和情书数量
 * @return 已有数据能够证实的成就 ID
 */
export function giftAchievements(details: Snapshot | undefined): AchievementId[] {
  const { gifts, troubles, workMessages, letters } = details ?? {}
  const awards: AchievementId[] = []
  if (gifts === 0 && typeof workMessages === 'number' && workMessages > 0 && workMessages === troubles) {
    awards.push('workaholic')
  }
  if (typeof gifts === 'number' && gifts >= 10 && troubles === 0) {
    awards.push('no-overtime')
  }
  if (typeof letters === 'number' && letters >= 3) {
    awards.push('boyfriend-letters')
  }
  return awards
}

/**
 * 根据已完成问答的单轮快照判断组合成就
 *
 * @date 2026/11/25 11:23
 * @param result 已保存的结果，使用快照中的题目和选项 ID
 * @return 本轮满足的问答成就 ID
 */
export function quizAchievements(result: GameResult): AchievementId[] {
  const snapshot = result.answerSnapshot?.answers
  if (result.kind !== 'couple-quiz' || result.status !== 'completed' || !Array.isArray(snapshot)) {
    return []
  }

  // 每道题只使用该轮保存的选项
  const answers = new Map(snapshot.map((answer) => [answer?.questionId, answer?.option?.id]))
  return quizRules.filter((rule) => Object.entries(rule.answers).every(([id, option]) => answers.get(id) === option))
    .map(({ id }) => id)
}

/**
 * 从已保存成品的材料配置判断花束或蛋糕成就
 *
 * @date 2026/11/25 11:23
 * @param work 单件成品，使用其保存时的材料快照
 * @return 这件作品满足的成就 ID
 */
export function workAchievements(work: Work): AchievementId[] {
  const design = work.snapshot.design as Snapshot | undefined
  const parts = work.kind === 'bouquet' ? design?.stems : design?.pieces
  if (!Array.isArray(parts)) {
    return []
  }

  // 每个实际保存的材料保留一次，供全种类和数量条件使用
  const kinds = parts.map((part) => part?.kind)
  const awards: AchievementId[] = []
  if (work.kind === 'bouquet') {
    if (flowers.every((kind) => kinds.includes(kind))) {
      awards.push('flower-family')
    }
    if (kinds.length >= 5 && kinds.every((kind) => kind === 'sunflower')) {
      awards.push('sunflower-bouquet')
    }
    if (kinds.length === 9 && kinds.every((kind) => kind === 'rose')) {
      awards.push('nine-roses')
    }
  } else {
    if (fruits.every((kind) => kinds.includes(kind))) {
      awards.push('fruit-cake')
    }
    if (kinds.filter((kind) => kind === 'dog').length >= 3) {
      awards.push('dog-cake')
    }
    if (design?.sponge === 'matcha' && kinds.includes('kiwi')
      && !kinds.some((kind) => kind !== 'kiwi' && fruits.includes(kind))) {
      awards.push('matcha-cake')
    }
  }
  return awards
}

/**
 * 判断当前所有已揭晓券面是否集齐
 *
 * @date 2026/11/25 11:23
 * @param tickets 历史券记录，包含已兑现的券
 * @param draws 历史抽取记录，未揭晓的抽取不计入
 * @return 已揭晓的券是否覆盖整个奖池
 */
export function hasAllTickets(tickets: readonly Ticket[], draws: readonly Draw[]) {
  const revealed = new Set(draws.filter((draw) => draw.revealedAt).map((draw) => draw.ticketId))
  const collected = new Set(tickets.filter((ticket) => revealed.has(ticket.id)).map((ticket) => ticket.type))
  return ticketTypes.every((type) => collected.has(type))
}

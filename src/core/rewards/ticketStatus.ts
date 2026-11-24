import type { Ticket } from '../storage/types'

/**
 * 计算券面状态，已兑现优先于时间到期
 *
 * @date 2026/11/24 19:28
 * @param ticket 已揭晓的兑换券
 * @param now 当前时间，毫秒
 * @return 可兑现、已兑现或已到期
 */
export function ticketStatus(ticket: Ticket, now: number) {
  if (ticket.usedAt) {
    return '已兑现'
  }
  if (ticket.validUntil && now > Date.parse(ticket.validUntil)) {
    return '已到期'
  }
  return '可兑现'
}

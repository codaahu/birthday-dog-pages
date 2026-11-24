import { ordinaryTickets, weekendTicket, type TicketType } from '../../config/rewards'
export { ticketStatus } from '../../core/rewards/ticketStatus'

const copies = [...ordinaryTickets, weekendTicket]
const dates = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Shanghai', hourCycle: 'h23',
})

/**
 * 读取已配置的券名及兑换内容
 *
 * @date 2026/11/24 17:54
 * @param type 已持久化的兑换券类型
 * @return 奖池中的券面文案
 */
export function ticketCopy(type: TicketType) {
  return copies.find((entry) => entry.type === type)!
}

/**
 * 以北京时间显示券面有效期和兑现时间
 *
 * @date 2026/11/24 17:54
 * @param value 存档中的标准日期时间
 * @return 北京时间的简短日期和时刻
 */
export function ticketDate(value: string) {
  return dates.format(Date.parse(value))
}

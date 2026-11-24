import { describe, expect, it } from 'vitest'
import { moduleIds } from '../../config/storyFlow'
import { weekendTicket } from '../../config/rewards'
import { config } from './config'
import Module from './Module.vue'
import { ticketCopy, ticketStatus } from './tickets'

describe('小狗扭蛋铺', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('gashapon')
    expect(Module).toBeDefined()
  })

  it('周末券在有效期内可兑现，已兑现的券到期后继续显示兑现状态', () => {
    const ticket = {
      id: 'weekend-test', type: weekendTicket.type, rarity: weekendTicket.rarity,
      runId: null, createdAt: '2026-11-24T00:00:00+08:00', validUntil: weekendTicket.validUntil,
    } as const
    const deadline = Date.parse(weekendTicket.validUntil)
    expect(ticketCopy(ticket.type).name).toBe('周末见面券')
    expect(ticketStatus(ticket, deadline)).toBe('可兑现')
    expect(ticketStatus(ticket, deadline + 1)).toBe('已到期')
    expect(ticketStatus({ ...ticket, usedAt: ticket.validUntil }, deadline + 1)).toBe('已兑现')
  })
})

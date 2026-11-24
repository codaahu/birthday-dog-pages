import { describe, expect, it } from 'vitest'
import { moduleIds } from '../../config/storyFlow'
import { config, roundMs } from './config'
import { advanceRound, catchAwards, catchTitle, emptyRound, giftPlan, type FallingGift } from './game'
import Module from './Module.vue'

describe('接礼物', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('catch-gifts')
    expect(Module).toBeDefined()
  })

  it('积分与称号按真实掉落计算，最低为零', () => {
    const drops: FallingGift[] = [
      { id: 0, born: 0, x: 180, kind: 'work' },
      { id: 1, born: 150, x: 180, kind: 'gift' },
      { id: 2, born: 300, x: 180, kind: 'letter' },
      { id: 3, born: 450, x: 180, kind: 'worry' },
      { id: 4, born: 600, x: 295, kind: 'berry' },
    ]
    expect(advanceRound(emptyRound, drops, 5000, 180)).toMatchObject({ score: 70, gifts: 2, troubles: 2 })
    expect([0, 79, 80, 149, 150, 249, 250].map(catchTitle)).toEqual([
      '今天也很可爱', '今天也很可爱', '快乐捕手', '快乐捕手', '礼物收割机', '礼物收割机', '寿星超神',
    ])
    expect(catchAwards(0)).toEqual(['catcher'])
    expect(catchAwards(200)).toEqual(['catcher', 'gift-harvester'])
    expect(catchAwards(300)).toEqual(['catcher', 'gift-harvester', 'birthday-warrior'])
  })

  it('不同刷新率得出相同结果，并在 30 秒处停止', () => {
    const plan = giftPlan(() => .41)
    const byInterval = (ms: number) => {
      let round = emptyRound
      for (let at = ms; at < roundMs; at += ms) {
        round = advanceRound(round, plan, at, 180)
      }
      return advanceRound(round, plan, roundMs + 900, 180)
    }
    const slow = byInterval(1000 / 30)
    const fast = byInterval(1000 / 120)
    expect(slow).toEqual(fast)
    expect(fast.elapsed).toBe(roundMs)
    expect(fast.gifts + fast.troubles).toBeGreaterThan(0)
  })
})

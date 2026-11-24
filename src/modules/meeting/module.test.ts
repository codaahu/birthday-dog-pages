import { describe, expect, it } from 'vitest'
import { moduleIds } from '../../config/storyFlow'
import { personal } from '../../config/personal'
import { meetingMoment } from '../../core/story/meetingClock'
import { config } from './config'
import Module from './Module.vue'

describe('周末见面站', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('meeting')
    expect(Module).toBeDefined()
    expect(config.playable).toBe(true)
  })

  it('用约定时间计算剩余天时分秒，最后一毫秒仍等候', () => {
    const target = Date.parse(personal.meetingAt)
    expect(meetingMoment(personal.meetingAt, target - 183845000).countdown).toEqual([2, 3, 4, 5])
    expect(meetingMoment(personal.meetingAt, target - 1).countdown).toEqual([0, 0, 0, 1])
  })

  it('到点即切换文案，北京时间次日再切换后续文案', () => {
    const target = Date.parse(personal.meetingAt)
    expect(meetingMoment(personal.meetingAt, target)).toMatchObject({ stage: 'arrived', countdown: null })
    const midnight = Date.parse('2026-12-06T00:00:00+08:00')
    expect(meetingMoment(personal.meetingAt, midnight - 1).stage).toBe('arrived')
    expect(meetingMoment(personal.meetingAt, midnight)).toMatchObject({ stage: 'after', countdown: null })
  })

  it('缺失或无法读取约定时间时只保留邀请', () => {
    for (const meetingAt of [undefined, '未知']) {
      expect(meetingMoment(meetingAt, Date.now())).toEqual({ stage: 'waiting', date: null, countdown: null })
    }
  })
})

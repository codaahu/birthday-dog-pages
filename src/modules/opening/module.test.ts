import { describe, expect, it } from 'vitest'
import { moduleIds } from '../../config/storyFlow'
import { config } from './config'
import Module from './Module.vue'
import { faceForPage, restoredPage } from './flow'

describe('开场', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('opening')
    expect(Module).toBeDefined()
  })

  it('恢复有效对白页码，超出当前对白范围时回到封面', () => {
    expect(restoredPage(2, 3)).toBe(2)
    expect(restoredPage(2, 1)).toBe(0)
    expect(restoredPage(undefined, 3)).toBe(0)
    expect(restoredPage(1.5, 3)).toBe(0)
  })

  it('沿用原对白页码切换说话角色，重玩由金毛开场', () => {
    expect([0, 1, 2, 3].map((page) => faceForPage(page, false))).toEqual([undefined, 'golden', 'maltese', 'golden'])
    expect(faceForPage(1, true)).toBe('golden')
  })
})

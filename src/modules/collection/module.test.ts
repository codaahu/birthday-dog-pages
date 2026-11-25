import { describe, expect, it } from 'vitest'
import { achievementCopy, achievementNames } from '../../config/achievements'
import { moduleIds } from '../../config/storyFlow'
import { achievementGroups, legacyConditions } from './achievementGroups'
import { config } from './config'
import Module from './Module.vue'

describe('永久生日小屋', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('collection')
    expect(Module).toBeDefined()
  })

  it('每个成就只归入一个分组，查看时都有对应条件', () => {
    const groupedIds = achievementGroups.flatMap(({ ids }) => [...ids])
    expect([...groupedIds].sort()).toEqual(Object.keys(achievementNames).sort())
    expect(achievementGroups.find(({ id }) => id === 'adventure')?.ids).toContain('flowers-and-cake')
    for (const id of groupedIds) {
      expect(achievementCopy[id]?.condition ?? legacyConditions[id]).toBeTruthy()
    }
  })
})

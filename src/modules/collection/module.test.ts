import { describe, expect, it } from 'vitest'
import { moduleIds } from '../../config/storyFlow'
import { config } from './config'
import Module from './Module.vue'

describe('永久生日小屋', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('collection')
    expect(Module).toBeDefined()
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { chapters, moduleIds, storyFlow } from '../../config/storyFlow'
import { personal } from '../../config/personal'
import { createServices } from '../../core/storage'
import { newId } from '../../core/storage/id'
import { resolveAccess } from '../../core/story/access'
import { config } from './config'
import Module from './Module.vue'
import { endingSummary } from './summary'

let services: ReturnType<typeof createServices>

beforeEach(() => {
  services = createServices('birthday-ending-test-' + newId())
})

afterEach(async () => {
  await services.db.delete()
})

describe('通关结算', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('ending')
    expect(config.playable).toBe(true)
    expect(Module).toBeDefined()
  })

  it('按轮次汇总探索和结果，兼容旧档并排除其他轮次及未揭晓的券', async () => {
    const { db } = services
    const time = '2026-11-24T10:00:00+08:00'
    await db.gameResults.bulkAdd([
      { id: 'other-score', runId: 'other', kind: 'catch-gifts', status: 'completed', score: 500, createdAt: time },
      { id: 'this-score', runId: 'this', kind: 'catch-gifts', status: 'completed', score: 0, createdAt: time },
      { id: 'this-puzzle', runId: 'this', kind: 'puzzle', status: 'skipped', createdAt: time },
      { id: 'this-quiz', runId: 'this', kind: 'couple-quiz', status: 'completed', details: { title: '天生一对' }, createdAt: time },
    ])
    await db.works.add({ id: 'other-bouquet', runId: 'other', kind: 'bouquet', snapshot: {}, favorite: false, createdAt: time })
    await db.tickets.bulkAdd([
      { id: 'this-ticket', runId: 'this', type: 'weekend-meeting', rarity: 'SSR', validUntil: personal.meetingAt, createdAt: time },
      { id: 'pending-ticket', runId: 'this', type: 'hug', rarity: 'R', createdAt: time },
    ])
    await db.draws.bulkAdd([
      { id: 'revealed', ticketId: 'this-ticket', runId: 'this', number: 1, createdAt: time, revealedAt: time },
      { id: 'pending', ticketId: 'pending-ticket', runId: 'this', number: 2, createdAt: time },
    ])
    const history = await services.history.read()
    const shop = await services.rewards.shop('this')
    const stats = { 'memory-room': { exploredAlbums: ['couple', 'couple', 'travel'] } }
    const now = Date.parse(personal.meetingAt) + 1
    expect(endingSummary('this', stats, history, shop, now).rows.map(({ value }) => value)).toEqual([
      '探索 2 个相册', '已跳过', '暂无记录', '暂无记录', '0 分', '天生一对', '1 张', '已到期',
    ])
    expect(endingSummary('new', undefined, history, shop, now).rows.slice(-2).map(({ value }) => value))
      .toEqual(['0 张', '已在此前领取'])
  })

  it('结算前刷新不会提前解锁，重复签收及重玩不会重复发放寿星成就', async () => {
    const { run } = await services.story.session()
    const first = run!
    first.step = 'ending'
    first.steps = Object.fromEntries(storyFlow.slice(0, -1).map((step) => [step, 'completed']))
    first.chapters = Object.fromEntries(chapters.map(({ id }) => [id, 'completed']))
    await services.db.runs.put(first)
    const reloaded = createServices(services.db.name)
    try {
      const before = await reloaded.story.session()
      expect(resolveAccess({ name: 'home' }, before.profile, before.run)).toEqual({ name: 'story', id: 'ending' })
      expect((await reloaded.history.read()).completions).toHaveLength(0)

      const attempts = await Promise.all([
        services.story.complete(first.id, 'ending', 'completed'),
        reloaded.story.complete(first.id, 'ending', 'completed'),
      ])
      expect(attempts.filter(Boolean)).toHaveLength(1)
      const unlocked = await reloaded.story.session()
      expect(resolveAccess({ name: 'home' }, unlocked.profile, unlocked.run)).toEqual({ name: 'collection' })

      const replay = (await services.story.startReplay())!
      replay.step = 'ending'
      replay.steps = first.steps
      replay.chapters = first.chapters
      await services.db.runs.put(replay)
      await services.story.complete(replay.id, 'ending', 'completed')
      const history = await reloaded.history.read()
      expect(history.completions.map(({ id }) => id)).toEqual(expect.arrayContaining([first.id, replay.id]))
      expect(history.completions).toHaveLength(2)
      expect(history.achievements.filter(({ id }) => id === 'birthday-star')).toMatchObject([{ runId: first.id }])
      expect((await reloaded.story.session()).profile).toMatchObject({ everCompleted: true, completedCount: 2 })
    } finally {
      reloaded.db.close()
    }
  })
})

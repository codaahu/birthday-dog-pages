import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { achievementCopy } from '../src/config/achievements'
import { ordinaryTickets, weekendTicket } from '../src/config/rewards'
import { createServices } from '../src/core/storage'
import {
  developmentDatabaseName, productionDatabaseName, schemaVersion, versionOneStores,
} from '../src/core/storage/database'
import { newId } from '../src/core/storage/id'
import { resolveAccess } from '../src/core/story/access'
import type { StoryStep } from '../src/config/storyFlow'

const databases = new Set<string>()

/**
 * 创建只在测试中使用的独立数据库
 *
 * @date 2026/11/24 10:54
 * @return 带随机存档名的业务服务
 */
function testServices() {
  const name = 'birthday-test-' + newId()
  databases.add(name)
  return createServices(name)
}

afterEach(async () => {
  await Promise.all([...databases].map((name) => Dexie.delete(name)))
  databases.clear()
})

/**
 * 用真实主线事务推进到首次扭蛋
 *
 * @date 2026/11/24 10:54
 * @param services 当前测试的存档服务
 * @return 首轮轮次 ID
 */
async function reachDraw(services: ReturnType<typeof testServices>) {
  const { run } = await services.story.session()
  const id = run!.id
  const steps: StoryStep[] = ['opening', 'memory-room', 'flower-shop', 'cake-shop', 'catch-gifts', 'couple-quiz']
  for (const step of steps) {
    expect(await services.story.complete(id, step, 'completed')).toBeDefined()
  }
  return id
}

/**
 * 用真实抽奖服务领取首轮四张券并完成冒险
 *
 * @date 2026/11/24 10:54
 * @param services 当前测试的存档服务
 * @return 已完成的轮次 ID
 */
async function finishFirst(services: ReturnType<typeof testServices>) {
  const id = await reachDraw(services)
  for (let index = 1; index <= 4; index += 1) {
    const receipt = await services.rewards.draw('first-' + index, id)
    await services.rewards.reveal(receipt!.draw.id)
  }
  for (const step of ['gashapon', 'meeting', 'ending'] as const) {
    expect(await services.story.complete(id, step, 'completed')).toBeDefined()
  }
  return id
}

describe('公共存档', () => {
  it('并发重复提交只记一次奖励，两项游乐场合计一枚币', async () => {
    const primary = testServices()
    const otherTab = createServices(primary.db.name)
    const [session, parallel] = await Promise.all([primary.story.session(), otherTab.story.session()])
    const id = session.run!.id
    expect(parallel.run?.id).toBe(id)
    expect(await primary.rewards.draw('before-first', null)).toBeUndefined()
    await primary.story.complete(id, 'opening', 'completed')
    const results = await Promise.all([
      primary.story.complete(id, 'memory-room', 'completed'),
      otherTab.story.complete(id, 'memory-room', 'completed'),
    ])
    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await otherTab.rewards.balance()).toBe(1)
    await primary.story.complete(id, 'flower-shop', 'completed')
    await primary.story.complete(id, 'cake-shop', 'completed')
    await primary.story.complete(id, 'catch-gifts', 'completed')
    expect(await primary.rewards.balance()).toBe(3)
    await primary.story.complete(id, 'couple-quiz', 'skipped')
    expect(await primary.rewards.balance()).toBe(4)
    expect((await primary.story.session()).run?.chapters.playground).toBe('skipped')
    expect(await primary.db.walletEntries.count()).toBe(4)
    otherTab.db.close()
    primary.db.close()
  })

  it('打开新连接可以恢复草稿，越关写入和生产深链接会被拒绝', async () => {
    const primary = testServices()
    const { profile, run } = await primary.story.session()
    expect(resolveAccess({ name: 'collection', id: 'gashapon' }, profile, run)).toEqual({ name: 'story', id: 'opening' })
    expect(await primary.story.complete(run!.id, 'meeting', 'completed')).toBeUndefined()
    await primary.story.saveDraft(run!.id, 'opening', { page: 2 })
    await primary.story.saveDraft(run!.id, 'cake-shop', { invalid: true })
    primary.db.close()
    const reloaded = createServices(primary.db.name)
    expect((await reloaded.story.session()).run?.drafts).toEqual({ opening: { page: 2 } })
    reloaded.db.close()
  })

  it('并发抽取只扣一枚币，待揭晓可恢复，别名重试仍返回原券', async () => {
    const primary = testServices()
    const id = await reachDraw(primary)
    const otherTab = createServices(primary.db.name)

    const [first, doubleClick] = await Promise.all([
      primary.rewards.draw('same-action', id),
      otherTab.rewards.draw('second-click', id),
    ])
    expect(doubleClick?.ticket.id).toBe(first?.ticket.id)
    expect(await otherTab.rewards.balance()).toBe(3)
    primary.db.close()
    expect((await otherTab.rewards.pending(id))?.draw.id).toBe(first?.draw.id)
    expect(await otherTab.story.complete(id, 'gashapon', 'completed')).toBeUndefined()
    await otherTab.rewards.reveal(first!.draw.id)
    expect(await otherTab.rewards.pending(id)).toBeUndefined()
    expect((await otherTab.rewards.draw('second-click', id))?.ticket.id).toBe(first?.ticket.id)
    expect(await otherTab.rewards.balance()).toBe(3)
    otherTab.db.close()
  })

  it('抽取写入失败会回滚钱包、券和待揭晓状态', async () => {
    const services = testServices()
    const id = await reachDraw(services)
    const block = () => { throw new Error('模拟抽取写入失败') }
    services.db.draws.hook('creating', block)
    await expect(services.rewards.draw('atomic', id)).rejects.toThrow()
    expect(await services.rewards.balance()).toBe(4)
    expect(await services.db.tickets.count()).toBe(0)
    expect(await services.db.walletEntries.count()).toBe(4)
    expect(await services.rewards.pending(id)).toBeUndefined()
    services.db.draws.hook('creating').unsubscribe(block)
    await expect(services.rewards.draw('atomic', id)).resolves.toBeDefined()
    services.db.close()
  })

  it('首轮前三张普通券互异，第四张固定 SSR，之后重玩无第二张 SSR', async () => {
    const services = testServices()
    const initial = await finishFirst(services)
    const firstTickets = await services.db.tickets.where('runId').equals(initial).toArray()
    expect(new Set(firstTickets.slice(0, 3).map((ticket) => ticket.type)).size).toBe(3)
    expect(firstTickets.slice(0, 3).every((ticket) => ticket.rarity !== 'SSR')).toBe(true)
    expect(firstTickets[3].type).toBe('weekend-meeting')
    const replay = await services.story.startReplay()
    expect(replay?.id).not.toBe(initial)
    const id = await reachDraw(services)
    expect(id).toBe(replay?.id)
    for (let index = 1; index <= 4; index += 1) {
      const receipt = await services.rewards.draw('replay-' + index, id)
      expect(receipt?.ticket.rarity).not.toBe('SSR')
      await services.rewards.reveal(receipt!.draw.id)
    }
    expect(await services.db.tickets.where('issuanceKey').equals('weekend-meeting').count()).toBe(1)
    services.db.close()
  })

  it('保留重玩前的作品、成绩、草稿以外的历史、兑现和永久权限', async () => {
    const services = testServices()
    const firstId = await finishFirst(services)
    await services.history.saveWork({ id: 'work', runId: firstId, kind: 'bouquet', snapshot: { stems: 5 } })
    await services.history.saveWork({ id: 'work', runId: firstId, kind: 'bouquet', snapshot: { stems: 7 } })
    await services.history.saveResult({ id: 'score', runId: firstId, kind: 'catch-gifts', status: 'completed', score: 130 })
    await services.history.saveResult({ id: 'score', runId: firstId, kind: 'catch-gifts', status: 'completed', score: 160 })
    await services.history.remember('photo-a', { explored: true })
    await services.history.discover('egg-a', firstId)
    const ticketId = 'ticket:first-1'
    const used = await services.rewards.redeem(ticketId, true)
    expect(used?.usedAt).toBeDefined()

    const replay = await services.story.startReplay()
    expect(replay).toBeDefined()
    const current = await services.story.session()
    expect(resolveAccess({ name: 'home' }, current.profile, current.run)).toEqual({ name: 'collection' })
    await services.story.saveDraft(replay!.id, 'opening', { page: 1 })
    await services.story.setReplayActive(false, replay!.id)
    expect((await services.story.session()).run?.status).toBe('paused')
    await services.story.setReplayActive(true, replay!.id)
    expect((await services.story.session()).run?.drafts.opening).toEqual({ page: 1 })
    expect((await services.story.session()).profile.everCompleted).toBe(true)
    expect(await services.story.complete(firstId, 'ending', 'completed')).toBeUndefined()
    const history = await services.history.read()
    expect(history.completions).toHaveLength(1)
    expect(history.works[0].snapshot.stems).toBe(5)
    expect(history.results[0].score).toBe(130)
    expect(history.memories[0].explored).toBe(true)
    expect(history.easterEggs).toHaveLength(1)
    expect(history.achievements.map((record) => record.id)).toContain('birthday-star')
    expect(history.tickets.find((ticket) => ticket.id === ticketId)?.usedAt).toBe(used?.usedAt)
    services.db.close()
  })

  it('迁移 v1 档案时补齐缺省项并保留已有历史', async () => {
    const name = 'birthday-test-legacy-' + newId()
    databases.add(name)
    const legacy = new Dexie(name)
    legacy.version(1).stores(versionOneStores)
    await legacy.table('profile').add({
      id: 'profile', schemaVersion: 1, firstVisitedAt: '2026-11-24', everCompleted: true,
      settings: { music: false }, lastRunId: 'historical-run',
    })
    await legacy.table('runs').add({
      id: 'historical-run', kind: 'first', status: 'completed', step: 'ending',
      steps: { ending: 'completed' }, createdAt: '2026-11-24',
    })
    await legacy.table('works').add({ id: 'legacy-bouquet', kind: 'bouquet', runId: 'historical-run' })
    legacy.close()

    const services = createServices(name)
    const { profile, run } = await services.story.session()
    expect(profile).toMatchObject({ schemaVersion, everCompleted: true, completedCount: 1, settings: { music: false, sound: true } })
    expect(run).toMatchObject({ id: 'historical-run', drafts: {}, chapters: {}, statistics: {} })
    expect(await services.db.works.get('legacy-bouquet')).toBeDefined()
    services.db.close()
  })

  it('开发与正式档案使用不同数据库名', () => {
    expect(productionDatabaseName).not.toBe(developmentDatabaseName)
  })

  it('同一成就跨连接只会首次写入，重开读取时保留原记录', async () => {
    const services = testServices()
    const other = createServices(services.db.name)
    const awarded = await Promise.all([
      services.history.unlock('room-observer', 'run-a'),
      other.history.unlock('room-observer', 'run-b'),
    ])
    expect(awarded.sort()).toEqual([false, true])
    const first = await services.db.achievements.get('room-observer')
    services.db.close()
    other.db.close()
    const reopened = createServices(services.db.name)
    expect(await reopened.history.unlock('room-observer', 'run-c')).toBe(false)
    expect(await reopened.db.achievements.get('room-observer')).toEqual(first)
    reopened.db.close()
  })

  it('作品与成就原子提交，同一 ID 重试保留原始快照', async () => {
    const services = testServices()
    const original = { id: 'saved-cake', kind: 'cake', runId: null, snapshot: { decor: 3 } } as const
    const failure = () => { throw new Error('模拟成就保存失败') }
    services.db.achievements.hook('creating', failure)
    await expect(services.history.saveWork(original, 'pastry')).rejects.toThrow('模拟成就保存失败')
    expect(await services.history.getWork(original.id)).toBeUndefined()
    services.db.achievements.hook('creating').unsubscribe(failure)
    const saved = await services.history.saveWork(original, 'pastry')
    const duplicate = await services.history.saveWork({ ...original, snapshot: { decor: 5 } }, 'pastry')
    expect(duplicate).toEqual(saved)
    expect(await services.history.getWork(original.id)).toEqual(saved)
    expect(await services.db.achievements.count()).toBe(1)
    expect(await services.rewards.balance()).toBe(0)
    services.db.close()
  })

  it('拼图结果和照片收录跨轮保留，独立预览草稿不会推进当前主线', async () => {
    const services = testServices()
    const { run } = await services.story.session()
    await services.story.saveDraft(run!.id, 'memory-room', { explored: ['couple'] }, true)
    const reloaded = await services.story.session()
    expect(reloaded.run?.step).toBe('opening')
    expect(reloaded.run?.drafts['memory-room']).toEqual({ explored: ['couple'] })
    const id = await finishFirst(services)
    await services.history.saveResult({
      id: 'puzzle-history', runId: id, kind: 'puzzle', status: 'completed',
      timeMs: 1234, moves: 5, details: { photoId: 'couple-photo' },
    })
    await services.history.remember('couple-photo', { explored: true, collected: true })
    await services.history.unlock('memory-collector', id)
    await services.story.startReplay()
    const history = await services.history.read()
    expect(history.results.find((result) => result.id === 'puzzle-history')?.timeMs).toBe(1234)
    expect(history.memories.find((photo) => photo.id === 'couple-photo')).toMatchObject({ collected: true })
    expect(history.achievements.some((item) => item.id === 'memory-collector')).toBe(true)
    services.db.close()
  })

  it('接礼物成绩和成就原子写入，重复提交不改成绩或发放新成就', async () => {
    const services = testServices()
    const other = createServices(services.db.name)
    const original = { id: 'gift-round', kind: 'catch-gifts', status: 'completed', runId: null, score: 210 } as const
    await services.history.saveResult({ ...original, id: 'older-gift', score: 180 })
    await services.history.saveResult({ ...original, id: 'separate-quiz', kind: 'couple-quiz', score: 900 })
    const failure = () => { throw new Error('模拟接礼物成就写入失败') }
    services.db.achievements.hook('creating', failure)
    await expect(services.history.settleScoredResult(original, ['catcher'])).rejects.toThrow('模拟接礼物成就写入失败')
    expect(await services.db.gameResults.get(original.id)).toBeUndefined()
    services.db.achievements.hook('creating').unsubscribe(failure)

    const commits = await Promise.all([
      services.history.settleScoredResult(original, ['catcher', 'gift-harvester']),
      other.history.settleScoredResult(original, ['catcher', 'gift-harvester']),
    ])
    expect(commits.map((item) => item.highestScore)).toEqual([210, 210])
    expect(commits.filter((item) => item.newRecord)).toHaveLength(1)
    expect(commits.flatMap((item) => item.unlocked)).toEqual(['catcher', 'gift-harvester'])
    const retry = await other.history.settleScoredResult({ ...original, score: 310 }, ['birthday-warrior'])
    expect(retry.record.score).toBe(210)
    expect(await services.db.achievements.get('birthday-warrior')).toBeUndefined()
    services.db.close()
    other.db.close()
  })

  it('扭蛋铺区分待揭晓和历史券，四次开壳后只保留一次 SSR', async () => {
    const services = testServices()
    const runId = await reachDraw(services)
    for (let number = 1; number <= 4; number += 1) {
      const receipt = await services.rewards.draw('shop-test-' + number, runId)
      const before = await services.rewards.shop(runId)
      expect(before).toMatchObject({ balance: 4 - number, firstRequired: true, roundOpened: number - 1, pending: receipt })
      expect(before.revealed.some(({ ticket }) => ticket.id === receipt!.ticket.id)).toBe(false)
      await services.rewards.reveal(receipt!.draw.id)
    }
    const after = await services.rewards.shop(runId)
    expect(after).toMatchObject({ balance: 0, firstRequired: true, canDraw: false, roundOpened: 4 })
    expect(after.pending).toBeUndefined()
    expect(after.revealed.filter(({ ticket }) => ticket.rarity === 'SSR')).toHaveLength(1)
    const ordinary = after.revealed.find(({ ticket }) => ticket.rarity === 'R' || ticket.rarity === 'SR')!
    await services.rewards.redeem(ordinary.ticket.id, false)
    expect((await services.rewards.shop(runId)).revealed.find(({ ticket }) => ticket.id === ordinary.ticket.id)?.ticket.usedAt).toBeUndefined()
    await services.rewards.redeem(ordinary.ticket.id, true)
    expect((await services.rewards.shop(runId)).revealed.find(({ ticket }) => ticket.id === ordinary.ticket.id)?.ticket.usedAt).toBeDefined()
    services.db.close()
  })
})

describe('新增成就与旧存档兼容', () => {
  it('重开旧档并从两个连接补发时，只写缺失成就，保留所有历史和小屋权限', async () => {
    const { db, rewards, history, story, backup } = testServices()
    const runId = await finishFirst({ db, rewards, history, story, backup })
    const createdAt = '2026-11-24T10:00:00+08:00'
    const issued = { runId, createdAt }

    // 直接写入旧版本已有的快照结构，避免触发新版实时成就
    await db.works.bulkAdd([
      { id: 'stored-flower', ...issued, kind: 'bouquet', favorite: true,
        snapshot: { design: { stems: Array.from({ length: 9 }, () => ({ kind: 'rose' })) } } },
      { id: 'stored-cake', ...issued, kind: 'cake', favorite: false,
        snapshot: { design: { sponge: 'matcha', pieces: [{ kind: 'kiwi' }, { kind: 'dog' }, { kind: 'dog' }, { kind: 'dog' }] } } },
    ])
    await db.gameResults.bulkAdd([
      { id: 'stored-catch', ...issued, kind: 'catch-gifts', status: 'completed', score: 320, details: { gifts: 10, troubles: 0 } },
      { id: 'stored-trouble', ...issued, kind: 'catch-gifts', status: 'completed', score: 0, details: { gifts: 0, troubles: 4 } },
      { id: 'stored-quiz', ...issued, kind: 'couple-quiz', status: 'completed', answerSnapshot: {
        version: '2026-11-24.1',
        answers: ['travel-role', 'retry-photo', 'birthday-boss', 'weekend-first'].map((questionId) => ({ questionId, option: { id: 'C' } })),
      } },
    ])
    const shop = await rewards.shop(null)
    const spent = shop.revealed.find(({ ticket }) => ticket.type !== 'weekend-meeting' && ticket.type !== 'hug')!
    await rewards.redeem(spent.ticket.id, true)

    const replay = await story.startReplay()
    await story.saveDraft(replay!.id, 'opening', { page: 'intro' })
    await story.setReplayActive(false, replay!.id)
    const previous = JSON.parse(await backup.exportJson())
    const previousAchievements = previous.tables.achievements
    const balance = await rewards.balance()
    const name = db.name
    db.close()

    const upgraded = createServices(name)
    const otherTab = createServices(name)
    try {
      await Promise.all([upgraded.history.reconcileAchievements(), otherTab.history.reconcileAchievements()])
      const next = JSON.parse(await upgraded.backup.exportJson())
      expect(next.tables.achievements).toEqual(expect.arrayContaining(previousAchievements))
      const newIds = next.tables.achievements
        .filter(({ id }: { id: string }) => !previousAchievements.some((entry: { id: string }) => entry.id === id))
        .map(({ id }: { id: string }) => id)
      expect(newIds.sort()).toEqual([
        'dog-cake', 'flowers-and-cake', 'matcha-cake', 'nine-roses', 'no-overtime',
        'quiz-all-c', 'quiz-golden-boss', 'quiz-photographer',
      ])
      next.tables.achievements = previousAchievements
      expect(next).toEqual(previous)
      expect(await upgraded.rewards.balance()).toBe(balance)
      const state = await upgraded.story.session()
      expect(resolveAccess({ name: 'home' }, state.profile, state.run)).toEqual({ name: 'collection' })
      const afterRepair = await upgraded.backup.exportJson()
      await upgraded.history.reconcileAchievements()
      expect(await upgraded.backup.exportJson()).toBe(afterRepair)
      expect(upgraded.backup.preview(afterRepair).works).toBe(2)
    } finally {
      upgraded.db.close()
      otherTab.db.close()
    }
  })

  it('问答只按同一轮的原题选项判定，重复结算沿用首次快照', async () => {
    const { history } = testServices()
    const questionIds = ['travel-role', 'retry-photo', 'birthday-boss', 'weekend-first']
    const cases = [
      ['DDDD', ['quiz-all-duties', 'quiz-birthday-hug', 'quiz-all-d']],
      ['CCCC', ['quiz-photographer', 'quiz-golden-boss', 'quiz-all-c']],
      ['BAAA', ['quiz-food-first']],
      ['ADAD', []],
      ['DCAA', []],
    ] as const
    for (const [letters, expected] of cases) {
      const result = {
        id: letters, runId: null, kind: 'couple-quiz' as const, status: 'completed' as const,
        answerSnapshot: { answers: questionIds.map((questionId, index) => ({ questionId, option: { id: letters[index] } })) },
      }
      expect((await history.settleQuizResult(result)).unlocked).toEqual(expected)
      const repeated = await history.settleQuizResult({ ...result, answerSnapshot: { answers: [] } })
      expect(repeated.unlocked).toEqual([])
      expect(repeated.record.answerSnapshot).toEqual(result.answerSnapshot)
    }
    expect(Object.entries(achievementCopy).filter(([, copy]) => copy.hidden).map(([id]) => id).sort())
      .toEqual(['dog-cake', 'nine-roses', 'quiz-all-c', 'quiz-golden-boss', 'workaholic'])
  })

  it('实时结算区分工作、烦恼和情书，花束与蛋糕按成品材料解锁', async () => {
    const { history } = testServices()
    const cases = [
      ['empty', { gifts: 0, troubles: 0, workMessages: 0, letters: 0 }, []],
      ['mixed', { gifts: 0, troubles: 2, workMessages: 1, letters: 0 }, []],
      ['work', { gifts: 0, troubles: 2, workMessages: 2, letters: 0 }, ['workaholic']],
      ['letters', { gifts: 10, troubles: 0, workMessages: 0, letters: 3 }, ['no-overtime', 'boyfriend-letters']],
    ] as const
    for (const [id, details, expected] of cases) {
      const result = { id, runId: null, kind: 'catch-gifts' as const, status: 'completed' as const, score: 0, details }
      expect((await history.settleScoredResult(result, [])).unlocked).toEqual(expected)
    }
    const flowers = ['tulip', 'lisianthus', 'daisy', 'sunflower', 'rose', 'hydrangea', 'gypsophila', 'eucalyptus']
    const fruits = ['strawberry', 'mango', 'blueberry', 'cherry', 'kiwi']
    await history.saveWork({ id: 'mixed-flowers', runId: null, kind: 'bouquet',
      snapshot: { design: { stems: flowers.map((kind) => ({ kind })) } } })
    await history.saveWork({ id: 'sunflowers', runId: null, kind: 'bouquet',
      snapshot: { design: { stems: Array.from({ length: 5 }, () => ({ kind: 'sunflower' })) } } })
    await history.saveWork({ id: 'fruit-cake', runId: null, kind: 'cake',
      snapshot: { design: { sponge: 'matcha', pieces: fruits.map((kind) => ({ kind })) } } })
    expect((await history.read()).achievements.map(({ id }) => id).sort()).toEqual([
      'boyfriend-letters', 'flower-family', 'flowers-and-cake', 'fruit-cake', 'no-overtime', 'sunflower-bouquet', 'workaholic',
    ])
  })

  it('最后一种券揭晓才算集齐，抱抱券需要确认兑现，第二次通关只记一次', async () => {
    const services = testServices()
    const { db, rewards, story, history } = services
    const firstId = await finishFirst(services)
    const createdAt = new Date().toISOString()

    // 补齐奖池剩余券种，保留最后一张为未揭晓
    const existing = new Set((await db.tickets.toArray()).map(({ type }) => type))
    const missing = [...ordinaryTickets, weekendTicket].filter(({ type }) => !existing.has(type))
    const finalId = 'achievement-draw-' + missing.at(-1)!.type
    for (const [index, entry] of missing.entries()) {
      const id = 'achievement-ticket-' + entry.type
      await db.tickets.add({ id, runId: null, createdAt, type: entry.type, rarity: entry.rarity })
      const drawId = 'achievement-draw-' + entry.type
      await db.draws.add({ id: drawId, ticketId: id, runId: null, number: index + 1, createdAt,
        revealedAt: drawId === finalId ? undefined : createdAt })
    }
    const hug = (await db.tickets.filter((ticket) => ticket.type === 'hug').first())!
    await rewards.redeem(hug.id, false)
    await history.reconcileAchievements()
    expect(await db.achievements.get('hug-delivered')).toBeUndefined()
    expect(await db.achievements.get('nine-capsules')).toBeUndefined()
    await rewards.reveal(finalId)
    const used = await rewards.redeem(hug.id, true)
    expect(used?.usedAt).toBeDefined()
    expect(await db.achievements.get('hug-delivered')).toBeDefined()
    expect(await db.achievements.get('nine-capsules')).toBeDefined()

    const replay = (await story.startReplay())!
    expect(await db.achievements.get('second-birthday')).toBeUndefined()
    for (const step of ['opening', 'memory-room', 'flower-shop', 'cake-shop', 'catch-gifts', 'couple-quiz',
      'gashapon', 'meeting', 'ending'] as const) {
      await story.complete(replay.id, step, 'completed')
    }
    expect(await db.achievements.get('second-birthday')).toBeDefined()
    expect(await db.completions.count()).toBe(2)
    expect(await db.completions.get(firstId)).toBeDefined()
    expect(await story.complete(replay.id, 'ending', 'completed')).toBeUndefined()
  })
})

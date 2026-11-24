import { afterEach, describe, expect, it } from 'vitest'
import { personal } from '../src/config/personal'
import { storyFlow } from '../src/config/storyFlow'
import { createServices } from '../src/core/storage'
import { newId } from '../src/core/storage/id'

const stores: ReturnType<typeof createServices>[] = []

/**
 * 创建仅供备份验证的独立档案
 *
 * @date 2026/11/24 19:35
 * @return 测试使用的存档服务
 */
function store() {
  const services = createServices('birthday-backup-test-' + newId())
  stores.push(services)
  return services
}

afterEach(async () => {
  await Promise.all(stores.splice(0).map(({ db }) => db.delete()))
})

/**
 * 通过现有主线服务实际完成首轮并领取四张券
 *
 * @date 2026/11/24 19:35
 * @param services 当前测试档
 * @return 已完成轮次 ID 与已揭晓券 ID
 */
async function completeAdventure(services: ReturnType<typeof store>) {
  const { run } = await services.story.session()
  for (const step of storyFlow) {
    if (step === 'gashapon') {
      for (let index = 0; index < 4; index += 1) {
        const receipt = (await services.rewards.draw(newId(), run!.id))!
        await services.rewards.reveal(receipt.draw.id)
      }
    }
    expect(await services.story.complete(run!.id, step, 'completed')).toBeDefined()
  }
  return run!.id
}

describe('生日小屋存档备份', () => {
  it('往返恢复真实历史和暂停轮次，反复合并只保留一份，并保留已兑现', async () => {
    const source = store()
    const target = store()
    const runId = await completeAdventure(source)
    await source.history.saveWork({ id: 'old-work', kind: 'cake', runId, snapshot: {} })
    const replay = (await source.story.startReplay())!
    await source.story.saveDraft(replay.id, 'opening', { page: 2 })
    await source.story.setReplayActive(false, replay.id)
    const json = await source.backup.exportJson()
    expect(target.backup.preview(json)).toEqual({ works: 1, games: 0, tickets: 4, completions: 1 })
    expect(await target.db.works.count()).toBe(0)
    await target.backup.merge(json)
    const ordinary = (await target.db.tickets.toArray()).find(({ rarity }) => rarity === 'R' || rarity === 'SR')!
    const redeemed = await target.rewards.redeem(ordinary.id, true)
    await target.backup.merge(json)
    expect((await target.db.tickets.get(ordinary.id))?.usedAt).toBe(redeemed?.usedAt)
    expect(await target.db.walletEntries.count()).toBe(8)
    expect(await target.rewards.balance()).toBe(0)
    expect(await target.db.works.count()).toBe(1)
    const current = await target.story.session()
    expect(current.profile.everCompleted).toBe(true)
    expect(current.run).toMatchObject({ id: replay.id, status: 'paused', drafts: { opening: { page: 2 } } })
  })

  it('跨两个通关档合并后周末券只保留一张，兑现与已有存档保留', async () => {
    const source = store()
    const target = store()
    const sourceId = await completeAdventure(source)
    const targetId = await completeAdventure(target)
    const sourceSsr = (await source.db.tickets.where('issuanceKey').equals('weekend-meeting').first())!
    await source.db.tickets.update(sourceSsr.id, { usedAt: personal.meetingAt })
    await target.backup.merge(await source.backup.exportJson())
    const result = await target.history.read()
    expect(result.completions.map(({ id }) => id)).toEqual(expect.arrayContaining([sourceId, targetId]))
    const ssr = result.tickets.filter(({ type }) => type === 'weekend-meeting')
    expect(ssr).toHaveLength(1)
    expect(ssr[0].usedAt).toBe(personal.meetingAt)
    expect(await target.db.draws.count()).toBe(7)
    expect(await target.rewards.balance()).toBe(1)
  })

  it('拒绝错误文件和缺失流水，并回滚所有已尝试写入的记录', async () => {
    const source = store()
    const target = store()
    await completeAdventure(source)
    const invalid = JSON.parse(await source.backup.exportJson())
    invalid.tables.walletEntries = invalid.tables.walletEntries.filter((entry: { reason: string }) => entry.reason === 'draw')
    expect(() => target.backup.preview('{"format":"other-app"}')).toThrow()
    expect(() => target.backup.preview('broken json')).toThrow()
    await expect(target.backup.merge(JSON.stringify(invalid))).rejects.toThrow()
    expect(await target.db.completions.count()).toBe(0)
    expect(await target.db.tickets.count()).toBe(0)
    expect(await target.db.profile.count()).toBe(0)
  })
})

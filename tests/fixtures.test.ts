import Dexie from 'dexie'
import { afterAll, expect, it } from 'vitest'
import { personal } from '../src/config/personal'
import { developmentDatabaseName } from '../src/core/storage/database'
import { openFixture, previewTime, scenarios } from '../src/dev/fixtures'

afterAll(async () => {
  await Promise.all(Object.keys(scenarios).map((key) => Dexie.delete(developmentDatabaseName + '-fixture-' + key)))
})

it('开发场景复用真实存档服务，重置当前场景不会影响其他场景', async () => {
  const history = await openFixture('history')
  const balance = await openFixture('balance')
  const ssr = await openFixture('ssr')
  const replay = await openFixture('replay')
  expect((await history.history.read()).works).toHaveLength(1)
  expect((await ssr.history.read()).tickets[0].rarity).toBe('SSR')
  expect((await replay.story.session()).run).toMatchObject({ kind: 'replay', step: 'opening' })
  expect(await balance.rewards.balance()).toBe(4)
  expect(previewTime('arrived')).toBe(Date.parse(personal.meetingAt))
  await balance.rewards.draw('fixture-draw', 'dev-example-run')
  expect(await balance.rewards.balance()).toBe(3)
  const reset = await openFixture('balance', true)
  expect(await reset.rewards.balance()).toBe(4)
  expect(await reset.rewards.pending('dev-example-run')).toBeUndefined()
  expect((await history.history.read()).works).toHaveLength(1)
  reset.db.close()
  ssr.db.close()
  replay.db.close()
  balance.db.close()
  history.db.close()
})

import { personal } from '../config/personal'
import type { PhotoManifest } from '../config/photos'
import { ordinaryTickets, weekendTicket } from '../config/rewards'
import { chapters, storyFlow, type StoryStep } from '../config/storyFlow'
import { createServices } from '../core/storage'
import { developmentDatabaseName, schemaVersion } from '../core/storage/database'
import { defaultSettings, type Profile, type Run } from '../core/storage/types'
import { addPiece, newCake } from '../modules/cake-shop/cake'
import { addStem, bouquetOrder, newBouquet } from '../modules/flower-shop/bouquet'

// 该图只用于测试相册空态与有图分支
const sampleImage = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="#dce7f1"/><rect x="105" y="67" width="270" height="186" rx="26" fill="#fff9f0" stroke="#403a34" stroke-width="3"/><path d="m108 82 132 98L372 82" fill="none" stroke="#403a34" stroke-width="3"/><text x="240" y="223" text-anchor="middle" fill="#403a34" font-size="24">DEV SAMPLE</text></svg>')

// 两种宽高比和一张无留言照片专用于本地相册手势验收
const gardenSample = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">' +
  '<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#e99b96"/><stop offset="1" stop-color="#fbe8bf"/></linearGradient></defs>' +
  '<rect width="640" height="480" fill="url(#sky)"/><circle cx="465" cy="136" r="65" fill="#fff0ba"/>' +
  '<path d="M0 306Q141 188 264 267T640 213V480H0Z" fill="#85917b"/>' +
  '<path d="M0 340Q161 274 279 331T640 291V480H0Z" fill="#627d6d"/>' +
  '<path d="M276 480q-55-75 43-152h57q-69 67 49 152" fill="#e9c59f"/>' +
  '<path d="M0 386q85 1 162 68l18 26H0zm640-42q-112 13-178 136h178" fill="#465d54"/>' +
  '<g fill="#f8c4bd"><circle cx="61" cy="415" r="9"/><circle cx="85" cy="434" r="8"/><circle cx="21" cy="422" r="6"/><circle cx="527" cy="428" r="10"/><circle cx="566" cy="385" r="7"/><circle cx="590" cy="422" r="8"/><circle cx="616" cy="369" r="6"/></g>' +
  '<g fill="#fbede0"><path d="M73 95q39-30 80 0 14-9 34 2H52q9-9 21-2m275 34q25-24 54 0h-68z"/></g></svg>',
)
const windowSample = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 620" width="420" height="620">' +
  '<rect width="420" height="620" fill="#e6c7a8"/><rect x="60" y="45" width="300" height="427" rx="140" fill="#fff3d8"/>' +
  '<rect x="75" y="61" width="270" height="395" rx="133" fill="#a6bec5"/>' +
  '<path d="M75 340q71-85 136-24 51-57 134-43v53q0 129-135 130T75 326" fill="#809b80"/>' +
  '<path d="M210 62v389M75 276h270" stroke="#fff4db" stroke-width="10"/>' +
  '<path d="M0 478q210-29 420 0v142H0" fill="#b6846c"/><path d="M91 488h201l-18 29H109z" fill="#fff2d6"/>' +
  '<path d="M128 440h62v40q-31 28-62 0zm100-14h62v46q-31 28-62 0z" fill="#f9e6cf"/>' +
  '<path d="M190 449q39-11 18 18l-18 4m100-34q39-11 18 18l-18 4" fill="none" stroke="#f9e6cf" stroke-width="7"/></svg>',
)

export const scenarios = {
  empty: '缺图 · 新档',
  progress: '首次 · 进行中',
  completed: '已通关',
  replay: '重玩 · 开场',
  balance: '四枚狗狗币',
  history: '历史作品与成绩',
  photos: '本机照片',
  ssr: '已领取周末券',
  arrived: '见面时间已到',
  ending: '首次 · 待确认结算',
  collection: '生日小屋 · 示例收藏',
} as const

export type Scenario = keyof typeof scenarios

export const singlePhoto: PhotoManifest = {
  photos: [{
    id: 'dev-sample-letter', category: 'couple', title: '开发示例 · 信封插画',
    image: sampleImage, thumbnail: sampleImage, width: 480, height: 320,
  }],
}

export const scenarioPhotos: PhotoManifest = {
  photos: [
    { id: 'dev-sample-letter', category: 'couple', title: '暮色散步 · 开发示例',
      image: gardenSample, thumbnail: gardenSample, width: 640, height: 480,
      note: '这是一张用于验证拍立得翻面的测试留言。' },
    { id: 'dev-sample-window', category: 'couple', title: '窗边小记 · 开发示例',
      image: windowSample, thumbnail: windowSample, width: 420, height: 620,
      note: '这张竖图用来核对全屏查看时上下边缘是否完整。' },
    { id: 'dev-sample-postcard', category: 'couple', title: '信封插画 · 开发示例',
      image: sampleImage, thumbnail: sampleImage, width: 480, height: 320 },
    ...(['portrait', 'daily', 'travel', 'engagement', 'funny', 'puzzle', 'pet'] as const).map((category) => ({
      id: 'dev-sample-' + category, category, title: '开发示例 · 信封插画',
      image: sampleImage, thumbnail: sampleImage, width: 480, height: 320, note: '仅用于开发测试',
    })),
  ],
}

const fixtureAt = '2026-11-24T09:00:00+08:00'
const runId = 'dev-example-run'

/**
 * 返回开发情景时间，未指定情景时使用当前时间
 *
 * @date 2026/11/24 10:54
 * @param scenario 调试大厅选择的场景
 * @return 用于模块预览的 Unix 毫秒时间
 */
export function previewTime(scenario: Scenario) {
  return scenario === 'arrived' ? Date.parse(personal.meetingAt) : Date.now()
}

/**
 * 打开单个测试场景的独立存档，并按需安装示例记录
 *
 * @date 2026/11/24 19:09
 * @param scenario 调试大厅选择的场景
 * @param reset 是否重置当前场景，其他开发和正式存档不受影响
 * @return 已初始化的模块服务
 */
export async function openFixture(scenario: Scenario, reset = false) {
  const services = createServices(developmentDatabaseName + '-fixture-' + scenario)
  const { db } = services

  try {
    await db.transaction('rw', db.tables, async () => {
      // 动作只作用于本函数创建的开发场景数据库
      if (reset) {
        for (const table of db.tables) {
          const keys = await table.toCollection().primaryKeys()
          await table.bulkDelete(keys)
        }
      }
      if (await db.profile.get('profile')) {
        return
      }
      if (scenario === 'empty') {
        await services.story.session()
        return
      }

      const everCompleted = scenario !== 'progress' && scenario !== 'balance' && scenario !== 'ending'
      const profile: Profile = {
        id: 'profile', schemaVersion, firstVisitedAt: fixtureAt, everCompleted,
        completedCount: everCompleted ? 1 : 0, firstCompletedAt: everCompleted ? fixtureAt : undefined,
        activeRunId: everCompleted ? undefined : runId, lastRunId: runId, settings: { ...defaultSettings },
      }
      const run: Run = {
        id: runId, kind: 'first', status: everCompleted ? 'completed' : 'active',
        step: everCompleted || scenario === 'ending' ? 'ending' : scenario === 'balance' ? 'gashapon' : 'flower-shop',
        steps: { opening: 'completed', 'memory-room': 'completed' },
        chapters: { memory: 'completed' }, statistics: {}, drafts: {}, createdAt: fixtureAt,
        completedAt: everCompleted ? fixtureAt : undefined,
      }
      await db.profile.add(profile)
      await db.runs.add(run)
      if (everCompleted) {
        await db.completions.add({ id: runId, createdAt: fixtureAt, statistics: {} })
        await db.achievements.add({ id: 'birthday-star', runId, createdAt: fixtureAt })
      }
      if (scenario === 'replay') {
        await services.story.startReplay()
      }
      if (scenario === 'ending') {
        await seedEnding(services, run)
      }
      if (scenario === 'collection') {
        await seedHouse(services, run)
      }

      // 余额场景写入真实流水结构，方便模块沿用真实查询
      if (scenario === 'balance') {
        run.steps = { ...run.steps, 'flower-shop': 'completed', 'cake-shop': 'completed', 'catch-gifts': 'completed', 'couple-quiz': 'completed' }
        run.chapters = { ...run.chapters, flower: 'completed', cake: 'completed', playground: 'completed' }
        await db.runs.put(run)
        for (const chapterId of ['memory', 'flower', 'cake', 'playground'] as const) {
          await db.walletEntries.add({ id: 'chapter:' + runId + ':' + chapterId, runId, amount: 1, reason: 'chapter', chapterId, createdAt: fixtureAt })
        }
        await db.wallet.put({ id: 'wallet', balance: 4 })
      }
      if (scenario === 'history') {
        await db.works.add({ id: 'dev-example-bouquet', runId, kind: 'bouquet', snapshot: { sample: true }, favorite: true, createdAt: fixtureAt })
        await db.gameResults.add({ id: 'dev-example-catch', runId, kind: 'catch-gifts', status: 'completed', score: 180, createdAt: fixtureAt })
      }
      if (scenario === 'ssr') {
        await db.tickets.add({
          id: 'dev-example-weekend', runId, type: 'weekend-meeting', rarity: 'SSR',
          issuanceKey: 'weekend-meeting', validUntil: personal.meetingAt, createdAt: fixtureAt,
        })
        await db.draws.add({ id: 'dev-example-draw', runId, number: 4, ticketId: 'dev-example-weekend', createdAt: fixtureAt, revealedAt: fixtureAt })
      }
    })
    return services
  } catch (error) {
    console.error('准备开发场景失败', error)
    db.close()
    throw error
  }
}

/**
 * 在独立开发档创建待结算轮次，让预览使用真实查询与首次通关事务
 *
 * @date 2026/11/24 19:09
 * @param services 当前开发场景的存档服务
 * @param run 刚写入的开发轮次，当前步骤必须为结算
 */
async function seedEnding({ db }: ReturnType<typeof createServices>, run: Run) {
  // 预置三种相册探索、拼图跳过、已完成作品及本轮游戏成绩
  const details = { title: '天生一对', answered: 4 }
  run.steps = Object.fromEntries(storyFlow.filter((step) => step !== 'ending')
    .map((step: StoryStep) => [step, 'completed']))
  run.chapters = Object.fromEntries(chapters.map(({ id }) => [id, 'completed']))
  run.statistics = {
    'memory-room': { exploredAlbums: ['couple', 'portrait', 'travel'], puzzleStatus: 'skipped' },
    'flower-shop': { workId: 'dev-ending-bouquet' },
    'cake-shop': { workId: 'dev-ending-cake' },
    'catch-gifts': { resultId: 'dev-ending-catch', score: 286 },
    'couple-quiz': { resultId: 'dev-ending-quiz', answered: details.answered },
    gashapon: { revealedDraws: 4 },
    meeting: { letterOpened: true },
  }
  await db.runs.put(run)
  await db.works.bulkAdd([
    { id: 'dev-ending-bouquet', runId: run.id, kind: 'bouquet', snapshot: { sample: true }, favorite: false, createdAt: fixtureAt },
    { id: 'dev-ending-cake', runId: run.id, kind: 'cake', snapshot: { sample: true }, favorite: false, createdAt: fixtureAt },
  ])
  await db.gameResults.bulkAdd([
    { id: 'dev-ending-catch', runId: run.id, kind: 'catch-gifts', status: 'completed', score: 286, createdAt: fixtureAt },
    { id: 'dev-ending-quiz', runId: run.id, kind: 'couple-quiz', status: 'completed', details, createdAt: fixtureAt },
  ])

  // 只有已揭晓的券参与正式模块结算
  const prizes = [...ordinaryTickets.slice(0, 3), weekendTicket]
  for (const [index, prize] of prizes.entries()) {
    const ticketId = 'dev-ending-ticket-' + index
    await db.tickets.add({
      id: ticketId, runId: run.id, type: prize.type, rarity: prize.rarity, createdAt: fixtureAt,
      ...('validUntil' in prize ? { issuanceKey: prize.type, validUntil: prize.validUntil } : {}),
    })
    await db.draws.add({
      id: 'dev-ending-draw-' + index, runId: run.id, ticketId,
      number: index + 1, createdAt: fixtureAt, revealedAt: fixtureAt,
    })
  }
}

/**
 * 准备能打开、编辑和导出的开发作品，结算统计沿用示例轮次
 *
 * @date 2026/11/24 19:32
 * @param services 隔离的开发存档服务
 * @param run 已通关的示例轮次
 */
async function seedHouse(services: ReturnType<typeof createServices>, run: Run) {
  const { db } = services
  let bouquet = { ...newBouquet(), id: 'dev-ending-bouquet' }
  for (const variety of ['tulip', 'tulip', 'tulip'] as const) {
    bouquet = addStem(bouquet, variety, 0)
  }
  const cake = addPiece({ ...newCake(), id: 'dev-ending-cake' }, 'strawberry')
  await db.works.update(bouquet.id, { snapshot: { design: bouquet, order: bouquetOrder(bouquet) } })
  await db.works.update(cake.id, { snapshot: { design: cake } })
  await db.gameResults.update('dev-ending-catch', { details: { gifts: 12, troubles: 1, title: '寿星超神' } })
  await db.runs.update(run.id, { steps: { ...run.steps, ending: 'completed' } })
  await db.completions.update(run.id, { statistics: run.statistics })
}

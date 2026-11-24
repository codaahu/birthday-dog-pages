import type { ShopState } from '../../core/rewards'
import { ticketStatus } from '../../core/rewards/ticketStatus'
import type { HistoryService } from '../../core/storage/history'
import type { GameResult, Snapshot } from '../../core/storage/types'

type History = Awaited<ReturnType<HistoryService['read']>>

/**
 * 读取本轮的通关统计，旧存档缺失统计时使用这一轮的历史记录
 *
 * @date 2026/11/24 19:07
 * @param runId 本轮 ID，无轮次时传 null
 * @param statistics 已完成关卡的原始统计
 * @param history 本机作品、游戏及成就记录
 * @param shop 已揭晓的券与其抽取记录
 * @param now 当前时间戳，单位毫秒
 * @return 可直接显示的各项文案及寿星成就是否已领取
 */
export function endingSummary(runId: string | null, statistics: Readonly<Snapshot> | undefined,
  history: History, shop: ShopState, now: number) {
  const memory = stepStatistics(statistics?.['memory-room'])
  const catcher = stepStatistics(statistics?.['catch-gifts'])
  const affinity = stepStatistics(statistics?.['couple-quiz'])

  // 优先采用主线提交的成绩，旧档按时间选取同一轮最近的记录
  const results = history.results.filter((item) => runId !== null && item.runId === runId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
  const puzzle = results.find((item) => item.kind === 'puzzle')
  const caught = completedResult(results, 'catch-gifts', catcher?.resultId)
  const quiz = completedResult(results, 'couple-quiz', affinity?.resultId)
  const score = caught?.score ?? catcher?.score
  const quizTitle = quiz?.details?.title
  const quizCount = quiz?.details?.answered ?? affinity?.answered
  const puzzleStatus = memory?.puzzleStatus ?? puzzle?.status
  const albumCount = Array.isArray(memory?.exploredAlbums)
    ? new Set(memory.exploredAlbums.filter((item) => typeof item === 'string')).size : undefined

  const works = history.works.filter((work) => runId !== null && work.runId === runId)
  const tickets = shop.revealed.filter(({ draw, ticket }) => runId !== null && draw.runId === runId && ticket.runId === runId)
  const weekend = tickets.find(({ ticket }) => ticket.type === 'weekend-meeting')?.ticket
  let weekendLabel = '本轮未领取'
  if (weekend) {
    weekendLabel = ticketStatus(weekend, now)
  } else if (shop.revealed.some(({ ticket }) => ticket.type === 'weekend-meeting')) {
    weekendLabel = '已在此前领取'
  }

  return {
    rows: [
      { label: '珍贵回忆', value: albumCount === undefined ? '暂无记录' : albumCount ? '探索 ' + albumCount + ' 个相册' : '本轮未探索相册' },
      { label: '合照拼图', value: puzzleStatus === 'completed' ? '已完成' : puzzleStatus === 'skipped' ? '已跳过' : '暂无记录' },
      { label: '专属生日花束', value: works.some(({ kind }) => kind === 'bouquet') ? '已制作' : '暂无记录' },
      { label: '生日蛋糕', value: works.some(({ kind }) => kind === 'cake') ? '已许愿' : '暂无记录' },
      { label: '接礼物挑战', value: typeof score === 'number' ? score + ' 分' : '暂无记录' },
      { label: '默契问答', value: typeof quizTitle === 'string' ? quizTitle : typeof quizCount === 'number' ? '已答 ' + quizCount + ' 题' : '暂无记录' },
      { label: '专属兑换券', value: tickets.length + ' 张' },
      { label: '周末见面券', value: weekendLabel },
    ],
    starEarned: history.achievements.some(({ id }) => id === 'birthday-star'),
  }
}

/**
 * 兼容未记录关卡统计的旧档
 *
 * @date 2026/11/24 19:07
 * @param value 轮次统计中某一关的快照
 * @return 对象快照，其余值视为缺失
 */
function stepStatistics(value: unknown): Snapshot | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Snapshot
  }
}

/**
 * 按主线结果 ID 查找同轮成绩，缺少 ID 时取最新完成记录
 *
 * @date 2026/11/24 19:07
 * @param results 本轮游戏记录，按时间倒序
 * @param kind 游戏类别
 * @param id 主线提交的结果 ID，可缺省
 * @return 符合条件的已完成记录
 */
function completedResult(results: GameResult[], kind: GameResult['kind'], id: unknown) {
  return results.find((item) => item.kind === kind && item.status === 'completed'
    && (typeof id !== 'string' || item.id === id))
}

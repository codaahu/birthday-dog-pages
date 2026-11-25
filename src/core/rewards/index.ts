import { ordinaryTickets, weekendTicket } from '../../config/rewards'
import type { ChapterId } from '../../config/storyFlow'
import { hasAllTickets } from '../achievements/rules'
import { addAchievements } from '../storage/achievementRecords'
import type { BirthdayDatabase } from '../storage/database'
import type { Draw, Profile, Run, Ticket } from '../storage/types'

export interface DrawReceipt { draw: Draw; ticket: Ticket }
export interface ShopState {
  balance: number
  canDraw: boolean
  firstRequired: boolean
  roundOpened: number
  pending?: DrawReceipt
  revealed: DrawReceipt[]
}

export class RewardService {
  constructor(private readonly db: BirthdayDatabase, private readonly random = Math.random) {}

  /**
   * 读取当前余额
   *
   * @date 2026/11/24 10:54
   * @return 钱包不存在时返回 0
   */
  async balance() {
    return (await this.db.wallet.get('wallet'))?.balance ?? 0
  }

  /**
   * 在同一个读事务中查询钱包、本轮进度及已揭晓的券
   *
   * @date 2026/11/24 17:53
   * @param runId 当前主线轮次，收藏独立抽取传 null
   * @return 钱包及许可状态、当前待揭晓记录和已公开的历史券
   */
  async shop(runId: string | null): Promise<ShopState> {
    return this.db.transaction('r', [
      this.db.wallet, this.db.profile, this.db.runs, this.db.draws, this.db.tickets,
    ], async () => {
      const [balance, profile, run, draws, tickets] = await Promise.all([
        this.balance(), this.db.profile.get('profile'), runId ? this.db.runs.get(runId) : undefined,
        this.db.draws.toArray(), this.db.tickets.toArray(),
      ])
      const permitted = this.canDraw(profile, run, runId)
      const round = draws.filter((draw) => draw.runId === runId)
      const firstRequired = permitted && run?.kind === 'first'
      const ticketsById = new Map(tickets.map((ticket) => [ticket.id, ticket]))
      const revealed: DrawReceipt[] = []
      let pending: DrawReceipt | undefined

      for (const draw of draws) {
        const ticket = ticketsById.get(draw.ticketId)
        if (!ticket) {
          continue
        }
        if (draw.revealedAt) {
          revealed.push({ draw, ticket })
        } else if (draw.runId === runId && !pending) {
          pending = { draw, ticket }
        }
      }
      revealed.sort((a, b) => b.draw.revealedAt!.localeCompare(a.draw.revealedAt!) || b.draw.number - a.draw.number)
      return {
        balance, canDraw: permitted && (!firstRequired || round.length < 4), firstRequired,
        roundOpened: round.filter((draw) => draw.revealedAt).length, pending, revealed,
      }
    })
  }

  /**
   * 在关卡推进事务内记入章节奖励
   *
   * @date 2026/11/24 10:54
   * @param run 已持久化的本轮冒险
   * @param chapterId 完成的章节 ID
   * @param coins 该章节配置的发放数量
   * @param at 章节完成时间
   */
  async awardChapter(run: Run, chapterId: ChapterId, coins: number, at: string) {
    if (!coins) {
      return
    }
    await this.db.transaction('rw', this.db.wallet, this.db.walletEntries, async () => {
      // 用轮次和章节形成事务唯一主键
      const id = 'chapter:' + run.id + ':' + chapterId
      if (await this.db.walletEntries.get(id)) {
        return
      }
      const balance = await this.balance()
      await this.db.walletEntries.add({ id, runId: run.id, chapterId, amount: coins, reason: 'chapter', createdAt: at })
      await this.db.wallet.put({ id: 'wallet', balance: balance + coins })
    })
  }

  /**
   * 查找离开或刷新前已扣币但未揭晓的扭蛋
   *
   * @date 2026/11/24 10:54
   * @param runId 主线轮次 ID，收藏模式传 null
   * @return 待揭晓的抽取与券，没有待揭晓时为 undefined
   */
  async pending(runId: string | null): Promise<DrawReceipt | undefined> {
    return this.db.transaction('r', this.db.draws, this.db.tickets, async () => {
      const draws = await this.db.draws.filter((draw) => draw.runId === runId && !draw.revealedAt).first()
      if (draws) {
        const ticket = await this.db.tickets.get(draws.ticketId)
        if (ticket) {
          return { draw: draws, ticket }
        }
      }
    })
  }

  /**
   * 原子扣币并锁定抽取结果，重复命令或未揭晓时返回原抽取
   *
   * @date 2026/11/24 10:54
   * @param commandId 本次按钮操作的稳定 ID，重试沿用原值
   * @param runId 当前扭蛋章节轮次 ID，收藏模式传 null
   * @return 已持久化的抽取与券，余额不足或当前场景不允许时为 undefined
   */
  async draw(commandId: string, runId: string | null): Promise<DrawReceipt | undefined> {
    return this.db.transaction('rw', [
      this.db.profile, this.db.runs, this.db.wallet, this.db.walletEntries, this.db.tickets, this.db.draws, this.db.drawCommands,
    ], async () => {
      const command = await this.db.drawCommands.get(commandId)
      const existing = await this.db.draws.get(command?.drawId ?? commandId)
      if (existing?.runId === runId) {
        const ticket = await this.db.tickets.get(existing.ticketId)
        if (ticket) {
          return { draw: existing, ticket }
        }
      }
      if (existing) {
        return
      }

      // 首轮货币只在首次主线扭蛋章节开放，收藏抽取须先通关
      const profile = await this.db.profile.get('profile')
      const run = runId ? await this.db.runs.get(runId) : undefined
      if (!this.canDraw(profile, run, runId)) {
        return
      }
      const pending = await this.pending(runId)
      if (pending) {
        await this.db.drawCommands.add({ id: commandId, drawId: pending.draw.id })
        return pending
      }

      const balance = await this.balance()
      if (balance < 1) {
        return
      }

      // 首轮前三张普通券互异，第四张使用全库唯一发行键
      const first = run?.kind === 'first'
      const priorDraws = await this.db.draws.filter((draw) => draw.runId === runId).toArray()
      const number = priorDraws.length + 1
      if (first && number > 4) {
        return
      }
      const issued = await this.db.tickets.toArray()
      const priorTypes = new Set(issued.filter((ticket) => !first || ticket.runId === runId).map((ticket) => ticket.type))
      const unused = ordinaryTickets.filter((ticket) => !priorTypes.has(ticket.type))
      const pool = unused.length ? unused : ordinaryTickets
      const isWeekend = first && number === 4 && !issued.some((ticket) => ticket.type === weekendTicket.type)
      const prize = isWeekend ? weekendTicket : pool[Math.floor(this.random() * pool.length)]
      const createdAt = new Date().toISOString()
      const ticket: Ticket = {
        id: 'ticket:' + commandId, runId, type: prize.type, rarity: prize.rarity, createdAt,
        ...('validUntil' in prize ? { issuanceKey: prize.type, validUntil: prize.validUntil } : {}),
      }
      const draw: Draw = { id: commandId, runId, number, ticketId: ticket.id, createdAt }

      // 同一个事务写入流水、余额、券和待揭晓状态
      await this.db.walletEntries.add({ id: 'draw:' + commandId, runId, amount: -1, reason: 'draw', createdAt })
      await this.db.wallet.put({ id: 'wallet', balance: balance - 1 })
      await this.db.tickets.add(ticket)
      await this.db.draws.add(draw)
      return { draw, ticket }
    })
  }

  /**
   * 揭晓已付费扭蛋，保留首次揭晓时间
   *
   * @date 2026/11/25 11:25
   * @param id 抽取 ID
   * @return 更新后的抽取记录，找不到时为 undefined
   */
  async reveal(id: string) {
    return this.db.transaction('rw', this.db.draws, this.db.tickets, this.db.achievements, async () => {
      const draw = await this.db.draws.get(id)
      if (draw && !draw.revealedAt) {
        draw.revealedAt = new Date().toISOString()
        await this.db.draws.put(draw)

        // 仅已揭晓的不同券面计入套装
        if (!(await this.db.achievements.get('nine-capsules'))) {
          const [tickets, draws] = await Promise.all([this.db.tickets.toArray(), this.db.draws.toArray()])
          if (hasAllTickets(tickets, draws)) {
            await addAchievements(this.db, ['nine-capsules'], { createdAt: draw.revealedAt, runId: null })
          }
        }
      }
      return draw
    })
  }

  /**
   * 记下已确认的兑现操作，保留兑现历史
   *
   * @date 2026/11/25 11:25
   * @param id 已领取的券 ID
   * @param confirmed 用户是否已确认兑现
   * @return 当前券记录，找不到时为 undefined
   */
  async redeem(id: string, confirmed: boolean) {
    return this.db.transaction('rw', this.db.tickets, this.db.draws, this.db.achievements, async () => {
      const ticket = await this.db.tickets.get(id)
      const now = new Date().toISOString()
      if (confirmed && ticket && !ticket.usedAt && (!ticket.validUntil || now <= new Date(ticket.validUntil).toISOString())) {
        const draw = await this.db.draws.where('ticketId').equals(id).first()
        if (draw?.revealedAt) {
          ticket.usedAt = now
          await this.db.tickets.put(ticket)

          // 抱抱券真正兑现后才解锁
          if (ticket.type === 'hug') {
            await addAchievements(this.db, ['hug-delivered'], { createdAt: now, runId: ticket.runId })
          }
        }
      }
      return ticket
    })
  }

  /**
   * 判断当前入口是否具备投币权限
   *
   * @date 2026/11/24 17:53
   * @param profile 当前档案
   * @param run 已读取的指定轮次
   * @param runId 主线轮次 ID，收藏独立玩法为空
   * @return 是否具备投币入口权限，余额和待揭晓状态单独检查
   */
  private canDraw(profile: Profile | undefined, run: Run | undefined, runId: string | null) {
    if (!runId) {
      return Boolean(profile?.everCompleted)
    }
    return run?.status === 'active' && run.step === 'gashapon' && profile?.activeRunId === runId
  }
}

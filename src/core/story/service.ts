import { chapters, storyFlow, type StoryStep } from '../../config/storyFlow'
import type { RewardService } from '../rewards'
import { schemaVersion, type BirthdayDatabase } from '../storage/database'
import { newId } from '../storage/id'
import { defaultSettings, type Profile, type Run, type Settings, type Snapshot, type StepStatus } from '../storage/types'

export class StoryService {
  constructor(private readonly db: BirthdayDatabase, private readonly rewards: RewardService) {}

  /**
   * 获取档案，首次进入时原子创建第一轮
   *
   * @date 2026/11/24 10:54
   * @return 档案与当前或上次冒险
   */
  async session() {
    return this.db.transaction('rw', this.db.profile, this.db.runs, async () => {
      const profile: Profile = (await this.db.profile.get('profile')) ?? {
        id: 'profile', schemaVersion, firstVisitedAt: new Date().toISOString(), everCompleted: false,
        completedCount: 0, settings: { ...defaultSettings },
      }
      const runId = profile.activeRunId ?? profile.lastRunId
      let run = runId ? await this.db.runs.get(runId) : undefined
      if (!profile.everCompleted && !run) {
        run = await this.createRun('first')
        profile.activeRunId = run.id
        profile.lastRunId = run.id
        await this.db.profile.put(profile)
      }
      return { profile, run }
    })
  }

  /**
   * 更新音乐、音效和音量偏好
   *
   * @date 2026/11/24 10:54
   * @param changes 仅包含本次修改的设置
   */
  async updateSettings(changes: Partial<Settings>) {
    await this.db.transaction('rw', this.db.profile, async () => {
      const profile = await this.db.profile.get('profile')
      if (profile) {
        profile.settings = { ...profile.settings, ...changes }
        await this.db.profile.put(profile)
      }
    })
  }

  /**
   * 创建一轮重玩，保留上轮和永久解锁信息
   *
   * @date 2026/11/24 10:54
   * @return 新轮次，首次未通关时为 undefined
   */
  async startReplay() {
    return this.db.transaction('rw', this.db.profile, this.db.runs, async () => {
      const profile = await this.db.profile.get('profile')
      if (!profile?.everCompleted) {
        return
      }
      const previous = profile.activeRunId ? await this.db.runs.get(profile.activeRunId) : undefined
      if (previous?.status === 'active') {
        await this.db.runs.update(previous.id, { status: 'paused' })
      }
      const run = await this.createRun('replay')
      await this.db.profile.update('profile', { activeRunId: run.id, lastRunId: run.id })
      return run
    })
  }

  /**
   * 在重玩和永久小屋间切换，保留进度
   *
   * @date 2026/11/24 10:54
   * @param resume true 继续上轮重玩，false 暂停当前重玩
   * @param expectedRunId 界面显示的轮次 ID，防止旧标签影响新轮次
   * @return 重玩轮次，无可操作重玩时为 undefined
   */
  async setReplayActive(resume: boolean, expectedRunId: string) {
    return this.db.transaction('rw', this.db.profile, this.db.runs, async () => {
      const profile = await this.db.profile.get('profile')
      const runId = resume ? profile?.lastRunId : profile?.activeRunId
      if (!profile?.everCompleted || runId !== expectedRunId) {
        return
      }
      const run = await this.db.runs.get(runId)
      if (!run || run.kind !== 'replay' || run.status === 'completed') {
        return
      }

      run.status = resume ? 'active' : 'paused'
      await this.db.runs.put(run)
      await this.db.profile.update('profile', { activeRunId: resume ? run.id : undefined })
      return run
    })
  }

  /**
   * 保存当前关卡草稿，拒绝已离开的关卡写入
   *
   * @date 2026/11/24 11:25
   * @param runId 当前冒险轮次 ID
   * @param step 写草稿的关卡 ID
   * @param draft 可结构化克隆的草稿数据
   * @param preview 独立开发预览允许写入指定模块的测试草稿
   */
  async saveDraft(runId: string, step: StoryStep, draft: Snapshot, preview = false) {
    await this.db.transaction('rw', this.db.runs, async () => {
      const run = await this.db.runs.get(runId)
      if (run && ((run.status === 'active' && run.step === step) || (import.meta.env.DEV && preview))) {
        run.drafts[step] = draft
        await this.db.runs.put(run)
      }
    })
  }

  /**
   * 提交剧情结果并原子保存进度、奖励和通关信息
   *
   * @date 2026/11/24 10:54
   * @param runId 当前轮次 ID
   * @param step 本次上报的关卡 ID
   * @param status 完成或跳过状态
   * @param statistics 模块上报的实际统计快照，可省略
   * @return 接受提交后的轮次，无效或过期提交返回 undefined
   */
  async complete(runId: string, step: StoryStep, status: StepStatus, statistics?: Snapshot) {
    return this.db.transaction('rw', [
      this.db.profile, this.db.runs, this.db.wallet, this.db.walletEntries,
      this.db.draws, this.db.completions, this.db.achievements,
    ], async () => {
      const profile = await this.db.profile.get('profile')
      const run = await this.db.runs.get(runId)
      if (!profile || !run || profile.activeRunId !== runId || run.step !== step || run.status !== 'active' || run.steps[step]) {
        return
      }

      // 首次扭蛋需完成四次揭晓；两项游乐场模块合计只算一章
      if (step === 'gashapon' && run.kind === 'first') {
        const draws = await this.db.draws.where('runId').equals(run.id).toArray()
        if (draws.filter((draw) => draw.revealedAt).length !== 4) {
          return
        }
      }
      const now = new Date().toISOString()
      run.steps[step] = status
      delete run.drafts[step]
      if (statistics) {
        run.statistics[step] = statistics
      }
      for (const chapter of chapters) {
        if (!run.chapters[chapter.id] && chapter.steps.every((item) => run.steps[item])) {
          run.chapters[chapter.id] = chapter.steps.some((item) => run.steps[item] === 'skipped') ? 'skipped' : 'completed'
          await this.rewards.awardChapter(run, chapter.id, chapter.coins, now)
        }
      }

      // 结算记录与永久权限随最后一次确认一起写入
      if (step === 'ending') {
        run.status = 'completed'
        run.completedAt = now
        await this.db.completions.add({ id: run.id, createdAt: now, statistics: run.statistics })
        if (!profile.everCompleted) {
          await this.db.achievements.add({ id: 'birthday-star', runId, createdAt: now })
          profile.firstCompletedAt = now
        }
        profile.everCompleted = true
        profile.activeRunId = undefined
        profile.completedCount += 1
        await this.db.profile.put(profile)
      } else {
        run.step = storyFlow[storyFlow.indexOf(step) + 1]
      }
      await this.db.runs.put(run)
      return run
    })
  }

  /**
   * 在调用方事务内创建新的冒险轮次
   *
   * @date 2026/11/24 10:54
   * @param kind 首次或重玩
   * @return 已写入的初始轮次
   */
  private async createRun(kind: Run['kind']): Promise<Run> {
    const run: Run = {
      id: newId(), kind, status: 'active', step: 'opening',
      steps: {}, chapters: {}, drafts: {}, statistics: {}, createdAt: new Date().toISOString(),
    }
    await this.db.runs.add(run)
    return run
  }
}

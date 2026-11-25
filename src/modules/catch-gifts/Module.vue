<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import type { ModuleCompletion } from '../../core/story/contract'
import { newId } from '../../core/storage/id'
import type { GameResult } from '../../core/storage/types'
import AchievementToast from '../../shared/AchievementToast.vue'
import { useAchievementToast } from '../../shared/useAchievementToast'
import CatchField from './CatchField.vue'
import { giftKinds, roundMs } from './config'
import { advanceRound, basketX, catchAwards, catchTitle, emptyRound, giftPlan, type CatchTotals, type FallingGift } from './game'
import type { ModuleProps } from './types'

const props = defineProps<ModuleProps>()
const emit = defineEmits<{ completed: [result: ModuleCompletion] }>()

type Phase = 'loading' | 'ready' | 'starting' | 'playing' | 'paused' | 'saving' | 'save-error' | 'result'
const phase = ref<Phase>('loading')
const state = shallowRef(emptyRound)
const saved = ref<GameResult>()
const best = ref(0)
const record = ref(false)
const error = ref('')
const fieldView = ref<InstanceType<typeof CatchField>>()
const { visible: achievement, notify } = useAchievementToast()

// 活动时间与当前轮次只有一个 RAF 和一份待保存快照
let frame: number | undefined
let lastTick = 0
let roundId: string | undefined
let pending: CatchTotals | undefined
let plan: readonly FallingGift[] = []
let target = emptyRound.basket
let disposed = false
const held = new Set<'left' | 'right'>()

const seconds = computed(() => Math.ceil((roundMs - state.value.elapsed) / 1000))
const hitKind = computed(() => {
  const { hit, elapsed } = state.value
  return hit && elapsed - hit.at < 1150 ? giftKinds[hit.gift.kind] : undefined
})
const mood = computed(() => {
  if (phase.value === 'result') {
    return 'result'
  }
  if (phase.value === 'playing' || phase.value === 'paused') {
    return hitKind.value && hitKind.value.points < 0 ? 'warn' : 'play'
  }
  return 'idle'
})
const feedback = computed(() => {
  const item = hitKind.value
  if (!item || phase.value !== 'playing') {
    return '左右拖动篮子，接住礼物，把烦恼留给风。'
  }
  return 'reply' in item ? item.reply : '接住了' + item.name + '！'
})

onMounted(async () => {
  document.addEventListener('visibilitychange', pauseWhenHidden)
  window.addEventListener('pagehide', pauseWhenHidden)
  try {
    const history = await props.context.data.history.read()
    if (disposed) {
      return
    }
    const games = history.results.filter((item) => item.kind === 'catch-gifts' && item.status === 'completed')
    best.value = games.reduce((maximum, item) => Math.max(maximum, item.score ?? 0), 0)
    const draft = props.context.draft
    const previous = games.find((item) => item.id === draft?.roundId)
    if (previous) {
      showResult(previous)
      return
    }

    // 结果事务尚未完成时，用同一成绩 ID 接着提交
    const draftTotals = draft?.pending as Partial<CatchTotals> | undefined
    if (typeof draft?.roundId === 'string' && typeof draftTotals?.score === 'number'
      && typeof draftTotals.gifts === 'number' && typeof draftTotals.troubles === 'number') {
      roundId = draft.roundId
      pending = {
        score: draftTotals.score, gifts: draftTotals.gifts, troubles: draftTotals.troubles,
        workMessages: draftTotals.workMessages, letters: draftTotals.letters,
      }
      await settle()
      return
    }
  } catch (cause) {
    console.error('读取接礼物记录失败', cause)
    error.value = '暂时读不到历史成绩，可以重新开始。'
  }
  if (!disposed) {
    phase.value = 'ready'
  }
})

onUnmounted(() => {
  disposed = true
  stopFrame()
  document.removeEventListener('visibilitychange', pauseWhenHidden)
  window.removeEventListener('pagehide', pauseWhenHidden)
})

/**
 * 为一局分配稳定 ID，准备好草稿后开始计时
 *
 * @date 2026/11/24 16:04
 */
async function startRound() {
  if (phase.value !== 'ready' && phase.value !== 'result') {
    return
  }
  const before = phase.value
  const id = newId()
  phase.value = 'starting'
  error.value = ''
  try {
    await props.context.data.saveDraft({ roundId: id })
    if (disposed) {
      return
    }
    roundId = id
    pending = undefined
    plan = giftPlan()
    state.value = emptyRound
    target = emptyRound.basket
    saved.value = undefined
    record.value = false
    phase.value = 'paused'
    if (!document.hidden) {
      await resumeRound()
    }
  } catch (cause) {
    console.error('准备接礼物游戏失败', cause)
    error.value = '这一局还没准备好，再试一次吧。'
    phase.value = before
  }
}

/**
 * 从暂停点继续，仅计前台实际游戏时间
 *
 * @date 2026/11/24 16:04
 */
async function resumeRound() {
  if (phase.value !== 'paused' || document.hidden) {
    return
  }
  phase.value = 'playing'
  lastTick = performance.now()
  frame = requestAnimationFrame(tick)
  await nextTick()
  fieldView.value?.focusField()
}

/**
 * 推进游戏一帧，活动时间用尽时冻结成绩并发起一次结算
 *
 * @date 2026/11/25 11:27
 * @param now 浏览器帧时间戳
 */
function tick(now: number) {
  if (phase.value !== 'playing') {
    return
  }
  if (document.hidden) {
    pauseWhenHidden()
    return
  }

  const elapsed = Math.max(0, Math.min(now - lastTick, roundMs - state.value.elapsed))
  lastTick = now
  const direction = Number(held.has('right')) - Number(held.has('left'))
  target = basketX(target + direction * elapsed * .3)
  const next = advanceRound(state.value, plan, state.value.elapsed + elapsed, target)
  state.value = next
  if (next.elapsed < roundMs) {
    frame = requestAnimationFrame(tick)
    return
  }
  stopFrame()
  pending = {
    score: next.score, gifts: next.gifts, troubles: next.troubles,
    workMessages: next.workMessages, letters: next.letters,
  }
  void settle()
}

/**
 * 暂停后台帧并等待玩家主动继续
 *
 * @date 2026/11/24 16:04
 * @param event 页面可见性改变或进入浏览器页面缓存
 */
function pauseWhenHidden(event?: Event) {
  if (phase.value === 'playing' && (document.hidden || event?.type === 'pagehide')) {
    stopFrame()
    phase.value = 'paused'
  }
}

/**
 * 停止动画循环并清除方向键状态
 *
 * @date 2026/11/24 16:04
 */
function stopFrame() {
  if (frame !== undefined) {
    cancelAnimationFrame(frame)
    frame = undefined
  }
  held.clear()
}

/**
 * 记录触摸拖动的篮心坐标
 *
 * @date 2026/11/24 16:04
 * @param x 场地图层换算后的坐标
 */
function move(x: number) {
  target = basketX(x)
}

/**
 * 更新方向键状态，由下一帧按活动时间计算移动距离
 *
 * @date 2026/11/24 16:04
 * @param direction 左或右方向键
 * @param pressed 是否按下
 */
function setKey(direction: 'left' | 'right', pressed: boolean) {
  if (pressed) {
    held.add(direction)
  } else {
    held.delete(direction)
  }
}

/**
 * 原子提交成绩与成就，失败后使用同一成绩重试
 *
 * @date 2026/11/25 11:27
 */
async function settle() {
  if (!pending || !roundId || phase.value === 'saving') {
    return
  }

  const result = pending
  const id = roundId
  phase.value = 'saving'
  error.value = ''
  try {
    await props.context.data.saveDraft({ roundId: id, pending: result })
    const commit = await props.context.data.history.settleScoredResult({
      id, runId: props.context.runId, kind: 'catch-gifts', status: 'completed',
      score: result.score, timeMs: roundMs, details: {
        gifts: result.gifts, troubles: result.troubles, title: catchTitle(result.score),
        // 中途更新时，旧待结算数据没有这两个数量
        ...(result.workMessages === undefined ? {} : { workMessages: result.workMessages }),
        ...(result.letters === undefined ? {} : { letters: result.letters }),
      },
    }, catchAwards(result.score))
    if (disposed) {
      return
    }
    best.value = commit.highestScore
    record.value = commit.newRecord
    showResult(commit.record)
    commit.unlocked.forEach(notify)
  } catch (cause) {
    console.error('保存接礼物成绩失败', cause)
    if (!disposed) {
      error.value = '本局成绩还没存好，点一下重试。'
      phase.value = 'save-error'
    }
  }
}

/**
 * 显示已持久化成绩，兼容缺少礼物数量的旧记录
 *
 * @date 2026/11/24 16:04
 * @param game 已保存的接礼物记录
 */
function showResult(game: GameResult) {
  saved.value = game
  const { gifts, troubles } = game.details ?? {}
  state.value = {
    ...emptyRound, elapsed: roundMs, score: game.score ?? 0,
    gifts: typeof gifts === 'number' ? gifts : 0, troubles: typeof troubles === 'number' ? troubles : 0,
  }
  phase.value = 'result'
}

/**
 * 向主线调度上报本局成绩，章节奖励由既有主线服务计算
 *
 * @date 2026/11/24 16:04
 */
function continueStory() {
  if (saved.value) {
    emit('completed', { status: 'completed', statistics: {
      resultId: saved.value.id, score: state.value.score, gifts: state.value.gifts, troubles: state.value.troubles,
    } })
  }
}
</script>

<template>
  <section class="catch-page">
    <header class="catch-head">
      <p class="catch-chapter">CHAPTER 04 <span aria-hidden="true">·</span> 快乐游乐场</p>
      <h1>接住今天的快乐！</h1>
      <svg viewBox="0 0 210 16" aria-hidden="true"><path d="M12 11q62-11 98-5 47 8 89-3" /></svg>
    </header>

    <dl class="catch-hud" aria-label="本局成绩">
      <div><dt>剩余时间</dt><dd>{{ seconds }}<small>秒</small></dd></div>
      <div><dt>当前得分</dt><dd>{{ state.score }}</dd></div>
      <div><dt>历史最高</dt><dd>{{ best }}</dd></div>
    </dl>
    <progress class="clock-ribbon" :value="roundMs - state.elapsed" :max="roundMs" aria-label="剩余时间进度"></progress>

    <CatchField ref="fieldView" :round="state" :mood="mood" :active="phase === 'playing'"
      :ready="phase === 'ready' || phase === 'loading' || phase === 'starting'" :record="record && phase === 'result'"
      @move="move" @key="setKey" @release="held.clear()">
      <template #overlay>
        <div v-if="phase === 'ready' || phase === 'loading' || phase === 'starting'" class="field-card start-card">
          <p>篮子准备好啦</p>
          <button type="button" class="catch-primary" :disabled="phase !== 'ready'" @click="startRound">
            {{ phase === 'ready' ? '开始接礼物' : '正在准备…' }}
          </button>
        </div>
        <div v-else-if="phase === 'paused'" class="field-card">
          <p>先帮你把时间停住啦</p>
          <button type="button" class="catch-primary" @click="resumeRound">继续接礼物</button>
        </div>
        <div v-else-if="phase === 'saving' || phase === 'save-error'" class="field-card">
          <p role="status">{{ phase === 'saving' ? '正在保存本局成绩…' : error }}</p>
          <button v-if="phase === 'save-error'" type="button" class="catch-primary" @click="settle">重试保存</button>
        </div>
        <article v-else-if="phase === 'result'" class="field-card catch-result" aria-label="本局结算">
          <p v-if="record" class="new-record">刷新纪录！</p>
          <h2>{{ catchTitle(state.score) }}</h2>
          <p class="result-score">{{ state.score }}<small> 分</small></p>
          <dl>
            <div><dt>接住礼物</dt><dd>{{ state.gifts }}</dd></div>
            <div><dt>接住烦恼</dt><dd>{{ state.troubles }}</dd></div>
            <div><dt>历史最高</dt><dd>{{ best }}</dd></div>
          </dl>
        </article>
      </template>
    </CatchField>

    <p v-if="phase !== 'result'" class="catch-note" aria-live="polite">{{ feedback }}</p>
    <p v-if="error && phase !== 'save-error'" class="catch-error" role="alert">{{ error }}</p>
    <div v-if="phase === 'result'" class="catch-actions">
      <button v-if="context.mode !== 'collection'" type="button" class="catch-primary" @click="continueStory">继续冒险</button>
      <button v-if="context.mode !== 'story'" type="button" class="catch-again" @click="startRound">再玩一局</button>
    </div>
    <AchievementToast :achievement="achievement" />
  </section>
</template>

<style scoped>
.catch-page {
  --catch-ink: #4b4638;
  --garden-green: #526e55;
  --hand: 'Kaiti SC', STKaiti, KaiTi, '楷体', serif;
  max-width: 32rem;
  margin-inline: auto;
  padding: .68rem 0 max(.55rem, env(safe-area-inset-bottom));
  color: var(--catch-ink);
  background: radial-gradient(ellipse at 88% 18%, #e3edeb, transparent 42%), radial-gradient(ellipse at 10% 66%, #f8e8be, transparent 50%), #fff9ed;
}
.catch-head { text-align: center; padding: .45rem .12rem .3rem; }
.catch-chapter { display: flex; align-items: center; justify-content: center; gap: .45em; margin: 0 0 .5rem; color: var(--garden-green); font-size: .73rem; font-weight: 750; letter-spacing: .12em; }
.catch-chapter::before, .catch-chapter::after { content: ''; height: 1px; width: clamp(.7rem, 5vw, 1.5rem); background: #bea878; }
.catch-head h1 { margin: 0; color: var(--catch-ink); font: 750 clamp(1.4rem, 7vw, 2.4rem)/1.23 var(--hand); letter-spacing: -.06em; transform: rotate(-.9deg); text-shadow: .024em .024em currentColor; }
.catch-head svg { display: block; width: 43%; height: .68rem; margin: .16rem auto 0; fill: none; stroke: #d9b170; stroke-width: 3; stroke-linecap: round; }
.catch-hud { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: .2rem; text-align: center; margin: .36rem 0 .43rem; padding: .14rem 0 .2rem; }
.catch-hud div { display: flex; flex-direction: column-reverse; }
.catch-hud dd { margin: 0; font: 800 clamp(1.22rem, 6vw, 1.75rem)/1.15 system-ui, sans-serif; color: var(--garden-green); font-variant-numeric: tabular-nums; }
.catch-hud dd small { margin-inline-start: .18em; font-size: .54em; }
.catch-hud dt { color: #6b6551; font-size: .75rem; }
.clock-ribbon { display: block; width: calc(100% - .7rem); height: 5px; margin: 0 auto .45rem; border: 0; border-radius: 2rem; background: #e8e6c9; overflow: hidden; }
.clock-ribbon::-webkit-progress-bar { background: #e8e6c9; }
.clock-ribbon::-webkit-progress-value { border-radius: 2rem; background: #a2b690; }
.clock-ribbon::-moz-progress-bar { background: #a2b690; }
.field-card { display: grid; place-items: center; align-content: start; gap: .45rem; width: min(94%, 16rem); padding: .8rem .65rem .7rem; border: 1px solid #ad9d7d; border-radius: 1.1rem .86rem 1rem .91rem; background: #fff8e7ed; box-shadow: .18rem .25rem #9f80513c; text-align: center; transform: rotate(-1deg); }
.field-card p { margin: 0; }
.start-card { align-self: center; margin-top: -.8rem; }
.field-card > p:not(.result-score) { font: 750 1rem/1.35 var(--hand); }
.catch-primary { width: 100%; min-height: 46px; border: 1.5px solid #8b6b45; border-radius: 2rem; padding: .34rem .56rem; background: #f4d69a; color: #574333; box-shadow: 0 2px #aa82534b, inset 0 1px #fce9bc; font: 750 1.06rem/1.2 var(--hand); }
.catch-primary:active:not(:disabled) { transform: translateY(1px); }
.catch-result { align-self: start; margin-top: 18%; border-style: dashed; animation: result-reveal .3s ease-out both; }
.catch-result h2 { font: 750 1.35rem/1.2 var(--hand); margin: 0; color: var(--garden-green); }
.catch-result .new-record { padding: .12rem .48rem; color: #99553f; background: #fae1a7; border-radius: 1rem; font-size: .8rem; }
.result-score { color: #b06c43; font: 800 2rem/1 system-ui,sans-serif; font-variant-numeric: tabular-nums; }
.result-score small { font: 650 .67rem/1.2 system-ui,sans-serif; }
.catch-result dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; width: 100%; margin: .14rem 0 0; padding-top: .38rem; border-top: 1px dashed #c8ae81; }
.catch-result dt { color: #685e4d; font-size: .71rem; }
.catch-result dd { color: var(--garden-green); font-size: 1rem; font-weight: 750; margin: .08rem 0 0; }
.catch-note { min-height: 2.75rem; display: grid; place-items: center; margin: .65rem .1rem 0; padding: .27rem .4rem; border-radius: .85rem .73rem .89rem .72rem; background: #f7e7c3; text-align: center; font: 740 clamp(.81rem, 3.75vw, 1rem)/1.3 var(--hand); color: #694d39; }
.catch-error { margin: .36rem .1rem 0; text-align: center; color: #895745; font-size: .78rem; }
.catch-actions { display: grid; gap: .15rem; margin: .7rem .13rem 0; }
.catch-again { min-height: 44px; border: 0; background: transparent; color: var(--garden-green); text-decoration: underline; text-underline-offset: .22em; font: 750 .95rem/1.2 var(--hand); }
@keyframes result-reveal { from { opacity: .3; transform: translateY(.63rem) rotate(-2deg) scale(.96); } }
</style>

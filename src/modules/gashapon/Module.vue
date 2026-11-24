<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { dialogue } from '../../config/dialogue'
import type { DrawReceipt, ShopState } from '../../core/rewards'
import type { ModuleCompletion } from '../../core/story/contract'
import { newId } from '../../core/storage/id'
import type { Ticket } from '../../core/storage/types'
import ArtworkExport from '../../shared/studio/ArtworkExport.vue'
import GachaCast from './GachaCast.vue'
import GachaMachine from './GachaMachine.vue'
import TicketArtwork from './TicketArtwork.vue'
import { ticketCopy, ticketDate, ticketStatus } from './tickets'
import type { MachinePhase, ModuleProps, ShopMood } from './types'

const props = defineProps<ModuleProps>()
const emit = defineEmits<{ completed: [result: ModuleCompletion] }>()

const phase = ref<MachinePhase>('loading')
const shop = shallowRef<ShopState>()
const capsule = shallowRef<DrawReceipt>()
const selected = shallowRef<Ticket>()
const now = ref(props.context.now)
const error = ref('')
const confirming = ref(false)
const redeeming = ref(false)
const showNext = ref(false)
const art = ref<InstanceType<typeof TicketArtwork>>()
const cardClose = ref<HTMLButtonElement>()
let command: string | undefined
let animation: ReturnType<typeof setTimeout> | undefined
let clock: ReturnType<typeof setInterval> | undefined
let disposed = false

const quota = 4
const opened = computed(() => shop.value?.roundOpened ?? 0)
const balance = computed(() => shop.value?.balance)
const required = computed(() => shop.value?.firstRequired || (props.context.mode === 'story' && !props.context.replay))
const canPay = computed(() => Boolean(shop.value?.canDraw && (balance.value ?? 0) > 0 && !capsule.value))
const canContinue = computed(() => props.context.mode !== 'collection' && phase.value === 'idle' && Boolean(shop.value)
  && (required.value ? opened.value >= quota : props.context.mode === 'story' || opened.value > 0))
const state = computed(() => selected.value ? ticketStatus(selected.value, now.value) : undefined)
const tier = computed(() => capsule.value?.ticket.rarity ?? selected.value?.rarity)
const mood = computed<ShopMood>(() => {
  if (phase.value === 'rolling' || phase.value === 'inserting') {
    return 'spin'
  }
  if (phase.value === 'capsule' || phase.value === 'opening' || phase.value === 'ticket') {
    return phase.value === 'ticket' && tier.value === 'SSR' ? 'ssr' : 'open'
  }
  return 'idle'
})
const note = computed(() => {
  if (phase.value === 'rolling' || phase.value === 'inserting') {
    return '小狗听到扭蛋滚下来的声音啦！'
  }
  if (phase.value === 'capsule' || phase.value === 'opening') {
    return '掉下来啦，点一下扭蛋看看。'
  }
  if (required.value && opened.value >= quota) {
    return '四份礼物都收好啦。'
  }
  if (balance.value === 0) {
    return shop.value?.revealed.length ? '狗狗币用完啦，已经领到的券都在票夹里。' : '没有狗狗币，有余额后再来转一颗吧。'
  }
  if (shop.value && !shop.value.canDraw) {
    return '现在可以打开票夹，看看已经收好的券。'
  }
  return '小狗偷偷检查过了，里面全是好东西！'
})

onMounted(() => {
  clock = setInterval(() => { now.value = Math.max(Date.now(), props.context.now) }, 1000)
  void loadShop()
})
onUnmounted(() => {
  disposed = true
  clearTimeout(animation)
  clearInterval(clock)
})

/**
 * 从存档恢复余额、待揭晓扭蛋和本轮最后一张已开券
 *
 * @date 2026/11/24 17:55
 */
async function loadShop() {
  phase.value = 'loading'
  error.value = ''
  try {
    const snapshot = await props.context.data.rewardShop()
    if (disposed) {
      return
    }
    shop.value = snapshot
    capsule.value = snapshot.pending
    if (snapshot.pending) {
      phase.value = 'capsule'
      return
    }
    const latest = snapshot.revealed.find(({ draw }) => draw.runId === props.context.runId)
    if (latest) {
      present(latest.ticket)
      return
    }
    phase.value = 'idle'
  } catch (cause) {
    console.error('恢复扭蛋铺存档失败', cause)
    error.value = '票夹还没打开，点一下重试。'
    phase.value = 'idle'
  }
}

/**
 * 扣币和锁奖交给原有事务，前端只在收到回执后放出扭蛋
 *
 * @date 2026/11/24 17:55
 */
async function pay() {
  if (phase.value !== 'idle' || !canPay.value) {
    return
  }
  phase.value = 'inserting'
  error.value = ''
  showNext.value = false
  command ??= newId()

  try {
    const receipt = await props.context.data.draw(command)
    if (disposed) {
      return
    }
    command = undefined
    if (!receipt) {
      const updated = await props.context.data.rewardShop()
      shop.value = updated
      capsule.value = updated.pending
      phase.value = updated.pending ? 'capsule' : 'idle'
      return
    }

    if (receipt.draw.revealedAt) {
      present(receipt.ticket)
    } else {
      capsule.value = receipt
      phase.value = 'rolling'
      finishAnimation('capsule', 840)
    }
    await syncShop()
  } catch (cause) {
    console.error('投币并锁定扭蛋失败', cause)
    error.value = '这枚币的状态还没确认，再点一次会沿用同一笔操作。'
    phase.value = 'idle'
  }
}

/**
 * 揭晓上一次已扣币锁定的扭蛋，确保开壳动画与保存分离
 *
 * @date 2026/11/24 17:55
 */
async function reveal() {
  const receipt = capsule.value
  if (phase.value !== 'capsule' || !receipt) {
    return
  }
  phase.value = 'opening'
  error.value = ''
  try {
    const unlocked = await props.context.data.revealDraw(receipt.draw.id)
    if (disposed) {
      return
    }
    if (!unlocked?.revealedAt) {
      throw new Error('扭蛋揭晓记录不存在')
    }

    selected.value = receipt.ticket
    capsule.value = undefined
    confirming.value = false
    finishAnimation('ticket', 420)
    await syncShop()
    // 另一页可能已兑现同一张券，展示最新状态
    const latest = shop.value?.revealed.find(({ ticket }) => ticket.id === receipt.ticket.id)
    if (latest && selected.value?.id === latest.ticket.id) {
      selected.value = latest.ticket
    }
  } catch (cause) {
    console.error('打开已锁定扭蛋失败', cause)
    error.value = '这颗扭蛋还没完全打开，再点一下吧。'
    phase.value = 'capsule'
  }
}

/**
 * 重新读取持久状态，读取失败也保留已经收到的操作回执
 *
 * @date 2026/11/24 17:55
 */
async function syncShop() {
  try {
    const updated = await props.context.data.rewardShop()
    if (!disposed) {
      shop.value = updated
    }
  } catch (cause) {
    console.error('同步扭蛋余额和券历史失败', cause)
    if (!disposed) {
      error.value = '余额与票夹暂未同步，可重新读取。'
    }
  }
}

/**
 * 定时结束短动画，动画设置不影响任何持久操作
 *
 * @date 2026/11/24 17:55
 * @param next 动画结束后展示的阶段
 * @param duration 动画毫秒数
 */
function finishAnimation(next: 'capsule' | 'ticket', duration: number) {
  clearTimeout(animation)
  animation = setTimeout(() => {
    phase.value = next
    if (next === 'ticket') {
      void nextTick(() => cardClose.value?.focus({ preventScroll: true }))
    }
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration)
}

/**
 * 快进正在播放的转动效果，不重新投币
 *
 * @date 2026/11/24 17:55
 */
function skipMotion() {
  if (phase.value === 'rolling') {
    finishAnimation('capsule', 0)
  }
}

/**
 * 查看已揭晓历史券或刷新恢复的上一张券
 *
 * @date 2026/11/24 17:55
 * @param ticket 要展示的已揭晓券
 */
function present(ticket: Ticket) {
  if (capsule.value || phase.value === 'opening' || redeeming.value) {
    return
  }
  now.value = Math.max(Date.now(), props.context.now)
  selected.value = ticket
  confirming.value = false
  showNext.value = false
  phase.value = 'ticket'
  void nextTick(() => cardClose.value?.focus({ preventScroll: true }))
}

/**
 * 收好当前券并返回扭蛋机
 *
 * @date 2026/11/24 17:55
 */
function putAway() {
  if (!redeeming.value) {
    selected.value = undefined
    confirming.value = false
    capsule.value = shop.value?.pending
    phase.value = capsule.value ? 'capsule' : 'idle'
  }
}

/**
 * 二次确认后提交兑现，已兑现和已过期状态使用服务回执
 *
 * @date 2026/11/24 17:55
 */
async function redeem() {
  const ticket = selected.value
  if (!ticket || state.value !== '可兑现' || !confirming.value || redeeming.value) {
    return
  }
  redeeming.value = true
  error.value = ''
  try {
    const updated = await props.context.data.redeemTicket(ticket.id, true)
    if (!updated) {
      throw new Error('兑换券已无法读取')
    }
    selected.value = updated
    now.value = Math.max(Date.now(), props.context.now)
    confirming.value = false
    await syncShop()
  } catch (cause) {
    console.error('写入兑换券兑现状态失败', cause)
    error.value = '兑现状态还没存好，可以再试一次。'
  } finally {
    redeeming.value = false
  }
}

/**
 * 上报本轮已揭晓次数，章节推进交给主线
 *
 * @date 2026/11/24 17:55
 */
function finish() {
  if (canContinue.value && !capsule.value) {
    emit('completed', { status: opened.value ? 'completed' : 'skipped', statistics: { revealedDraws: opened.value } })
  }
}
</script>

<template>
  <section class="gacha-page">
    <header class="gacha-head">
      <p class="gacha-chapter">CHAPTER 05 <span aria-hidden="true">·</span> 小狗扭蛋铺</p>
      <h1>今日限定 · 快乐扭蛋</h1>
      <p class="head-note">本店没有谢谢惠顾，每次都能抽到快乐</p>
    </header>

    <div class="gacha-wallet">
      <p><span class="coin-mark" aria-hidden="true"></span><strong>{{ balance ?? '…' }}</strong> 枚狗狗币</p>
      <p>已领取 <strong>{{ opened }}{{ required ? ' / ' + quota : '' }}</strong> 份</p>
    </div>

    <template v-if="phase !== 'ticket' || !selected">
      <GachaMachine :phase="phase" :tier="tier" :can-pay="canPay" :mood="mood" @pay="pay" @open="reveal" />
      <p class="gacha-note" aria-live="polite">{{ note }}</p>
      <div class="holder-actions">
        <button v-if="phase === 'idle' && canPay" type="button" class="gacha-primary" @click="pay">投入一枚狗狗币，转动扭蛋</button>
        <button v-else-if="phase === 'capsule'" type="button" class="gacha-primary" @click="reveal">打开这颗扭蛋</button>
        <button v-else-if="phase === 'rolling'" type="button" class="gacha-text-button" @click="skipMotion">跳过动画</button>
        <button v-else-if="phase === 'idle' && !shop" type="button" class="gacha-primary" @click="loadShop">重新读取票夹</button>
      </div>
    </template>

    <article v-else class="ticket-result" :class="'tier-' + selected.rarity.toLowerCase()">
      <div class="ticket-showcase">
        <p v-if="selected.rarity === 'SSR'" class="ssr-title">金色扭蛋 · 周末见面</p>
        <div class="ticket-preview"><TicketArtwork ref="art" :ticket="selected" :now="now" /></div>
        <GachaCast :mood="mood" showcase />
        <svg v-if="selected.rarity === 'SSR'" class="ticket-spark" viewBox="0 0 386 255" aria-hidden="true">
          <path d="M37 65v17m-8-8h17M351 55v19m-9-9h18M321 184v17m-8-8h16m-238 5v13m-7-7h14" />
        </svg>
      </div>
      <p v-if="selected.usedAt" class="ticket-meta">兑现时间 {{ ticketDate(selected.usedAt) }}（北京时间）</p>
      <div class="ticket-tools">
        <ArtworkExport :key="selected.id + ':' + state" :artwork="() => art?.artwork" :filename="ticketCopy(selected.type).name + '-' + selected.id.slice(-8)" />
        <button v-if="state === '可兑现' && !confirming" type="button" class="secondary" :disabled="redeeming" @click="confirming = true">兑现这张券</button>
        <span v-else-if="state !== '可兑现'" class="ticket-state">{{ state }}</span>
      </div>
      <div v-if="confirming && state === '可兑现'" class="redeem-check">
        <p>确定兑现这张券吗？兑现后会留下盖章记录。</p>
        <button type="button" class="secondary" :disabled="redeeming" @click="confirming = false">取消</button>
        <button type="button" class="secondary confirm-redeem" :disabled="redeeming" @click="redeem">确认兑现</button>
      </div>
      <button ref="cardClose" type="button" class="gacha-primary put-away" :disabled="redeeming" @click="putAway">收好兑换券</button>
    </article>

    <p v-if="error" class="gacha-error" role="alert">
      {{ error }}
      <button v-if="shop && error.includes('未同步')" type="button" class="gacha-text-button" @click="syncShop">重新同步</button>
    </p>

    <details v-if="shop?.revealed.length && phase === 'idle'" class="ticket-wallet">
      <summary>我的票夹 <span>{{ shop.revealed.length }} 张</span></summary>
      <button v-for="{ ticket } in shop.revealed" :key="ticket.id" type="button" class="archive-ticket" @click="present(ticket)">
        <span class="rarity" :class="ticket.rarity.toLowerCase()">{{ ticket.rarity }}</span>
        <strong>{{ ticketCopy(ticket.type).name }}</strong>
        <span>{{ ticketStatus(ticket, now) }}</span>
      </button>
    </details>

    <div v-if="canContinue" class="next-gacha">
      <button v-if="!showNext" type="button" class="gacha-primary" @click="showNext = true">继续冒险</button>
      <template v-else>
        <p class="gacha-note">{{ shop?.revealed.some(({ ticket }) => ticket.rarity === 'SSR') ? dialogue.transitions.gashapon : '汪！带着这些快乐去下一站吧。' }}</p>
        <button type="button" class="gacha-primary" @click="finish">去见面站</button>
      </template>
    </div>
  </section>
</template>

<style scoped>
.gacha-page {
  --gacha-ink: #594331;
  --lavender-ink: #745f81;
  --hand: 'Kaiti SC', STKaiti, KaiTi, '楷体', serif;
  max-width: 31rem;
  margin-inline: auto;
  padding: .64rem .11rem max(.5rem, env(safe-area-inset-bottom));
  color: var(--gacha-ink);
  background: radial-gradient(ellipse at 90% 13%, #ede4f2, transparent 48%), radial-gradient(ellipse at 8% 62%, #fbefce, transparent 49%), #fff8ed;
}
.gacha-head { text-align: center; padding: .44rem .12rem .5rem; }
.gacha-chapter { display: flex; justify-content: center; align-items: center; gap: .46em; color: var(--lavender-ink); margin: 0 0 .45rem; font-size: .72rem; letter-spacing: .13em; font-weight: 750; }
.gacha-chapter::before, .gacha-chapter::after { content: ''; width: clamp(.7rem, 5vw, 1.5rem); height: 1px; background: #bca37a; }
.gacha-head h1 { margin: 0; font: 750 clamp(1.36rem, 6.8vw, 2.35rem)/1.23 var(--hand); letter-spacing: -.045em; transform: rotate(-.8deg); text-shadow: .025em .025em currentColor; }
.head-note { margin: .42rem 0 0; color: #795d47; font: 720 clamp(.81rem, 3.5vw, 1.03rem)/1.3 var(--hand); }
.gacha-wallet { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .25rem .55rem; margin: .16rem .03rem .56rem; }
.gacha-wallet p { display: flex; gap: .32rem; align-items: center; margin: 0; padding: .16rem .43rem; border: 1px solid #ddc7a7; border-radius: 1rem; background: #fff5dc; font-size: .75rem; color: #795e45; }
.gacha-wallet strong { color: #95653e; font-size: .94rem; font-variant-numeric: tabular-nums; }
.coin-mark { display: inline-block; width: .84rem; height: .84rem; border: 1px solid #c59556; border-radius: 50%; background: #f0c875; box-shadow: inset 0 0 0 2px #f8da92; }
.gacha-note { margin: .57rem .05rem .49rem; padding: .41rem .55rem; text-align: center; border-radius: .82rem .75rem .88rem .63rem; background: #f6e7c6; color: #70543e; font: 740 clamp(.85rem, 4vw, 1.06rem)/1.38 var(--hand); }
.holder-actions { display: grid; place-items: center; }
.holder-actions:empty { display: none; }
.gacha-primary { width: 100%; min-height: 46px; padding: .32rem .61rem; border: 1.5px solid #8d6e4e; border-radius: 1.65rem; color: #5c4634; background: #f4d99e; box-shadow: 0 2px #a3785145, inset 0 1px #fce9c1; font: 750 1.05rem/1.23 var(--hand); }
.gacha-primary:active:not(:disabled) { transform: translateY(1px); }
.gacha-text-button { padding: 0 .55rem; border: 0; background: transparent; color: var(--lavender-ink); text-decoration: underline; text-underline-offset: .22em; font: 750 .93rem/1.3 var(--hand); }
.ticket-result { padding: .2rem 0 .1rem; }
.ticket-showcase { position: relative; isolation: isolate; overflow: hidden; min-height: 10rem; padding: .76rem .26rem 5.3rem; border-radius: 1rem .88rem 1.09rem .84rem; background: #eee3ef; }
.tier-r .ticket-showcase { background: radial-gradient(ellipse at center, #fff6e5 20%, #f2ded9 85%); }
.tier-ssr .ticket-showcase { background: radial-gradient(ellipse at 52% 37%, #fff8ce 9%, #fbde99 71%, #f0c581 100%); animation: ssr-glow .48s ease both; }
.ssr-title { margin: 0 0 .3rem; color: #8d5933; text-align: center; font: 750 1.03rem/1.28 var(--hand); }
.ticket-preview { position: relative; z-index: 1; width: 100%; margin-inline: auto; filter: drop-shadow(0 .25rem .3rem #9d734759); }
.ticket-spark { position: absolute; z-index: 3; inset: 0; width: 100%; height: 100%; pointer-events: none; fill: none; stroke: #f8e3a1; stroke-width: 3.6; stroke-linecap: round; animation: sparkle .75s ease both; }
.ticket-meta { margin: .38rem 0 .16rem; text-align: center; color: #785e49; font-size: .76rem; }
.ticket-tools { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: .38rem; margin-top: .55rem; }
.ticket-tools :deep(.secondary), .redeem-check .secondary { border: 1px solid #c7ab9d; border-radius: 1.2rem; color: #725d66; background: #fff8ea; font-size: .82rem; }
.ticket-tools :deep(.download) { text-align: center; }
.ticket-tools :deep(.download img) { margin-inline: auto; }
.ticket-state { color: #995e5a; font: 750 .92rem/1.25 var(--hand); }
.redeem-check { margin: .48rem .05rem; padding: .55rem .45rem; text-align: center; border: 1px dashed #c7a68e; border-radius: .65rem; background: #fff4e4; }
.redeem-check p { margin: 0 0 .37rem; font-size: .86rem; }
.redeem-check .secondary { margin-inline: .17rem; }
.redeem-check .confirm-redeem { border-color: #9b785d; background: #f1d4a6; }
.put-away { margin-top: .65rem; }
.gacha-error { margin: .43rem .16rem; color: #97564a; text-align: center; font-size: .79rem; }
.ticket-wallet { margin-top: .52rem; border-block: 1px dashed #d9c2a5; }
.ticket-wallet summary { padding: .64rem .27rem; color: var(--lavender-ink); cursor: pointer; font: 750 .96rem/1.4 var(--hand); }
.ticket-wallet summary span { margin-inline-start: .4rem; color: #785e49; font: 650 .72rem/1.2 system-ui,sans-serif; }
.archive-ticket { display: flex; align-items: center; gap: .44rem; width: 100%; margin: 0 0 .29rem; padding: .23rem .4rem; border: 1px solid #dbc6ac; border-radius: .62rem; background: #fff8ea; color: #785e49; text-align: start; font-size: .76rem; }
.archive-ticket strong { color: var(--gacha-ink); flex: 1; font-size: .87rem; }
.rarity { min-width: 2.06rem; padding: .12rem .25rem; border-radius: .5rem; text-align: center; font-size: .67rem; font-weight: 800; background: #f3dbcf; }
.rarity.sr { background: #e7dcef; }
.rarity.ssr { background: #f7dfa2; }
.next-gacha { margin-top: .6rem; }
@keyframes ssr-glow { from { opacity: .52; } to { opacity: 1; } }
@keyframes sparkle { 0% { opacity: 0; transform: scale(.83); } 55% { opacity: 1; } 100% { opacity: .62; transform: none; } }
</style>

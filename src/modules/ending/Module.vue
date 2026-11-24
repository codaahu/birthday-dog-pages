<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { achievementNames } from '../../config/achievements'
import { assets } from '../../config/assets'
import { personal } from '../../config/personal'
import type { ModuleCompletion } from '../../core/story/contract'
import { endingSummary } from './summary'
import type { ModuleProps } from './types'

const props = defineProps<ModuleProps>()
const emit = defineEmits<{ completed: [result: ModuleCompletion] }>()
const summary = shallowRef<ReturnType<typeof endingSummary>>()
const error = shallowRef(false)

// 未登记网页使用素材时，仅本地开发可加载角色预览图
const previewArt = assets.dogs.maltese['ending-celebrate-pair']
  ?? (import.meta.env.DEV ? '__birthday_dev_ending/pair-celebrate.png' : undefined)
const art = previewArt ? import.meta.env.BASE_URL + previewArt : undefined
const pairLabel = personal.maltese + '和' + personal.sender + '贴在一起庆祝'

watch(() => props.context.runId, async (runId, _previous, onCleanup) => {
  let active = true
  onCleanup(() => { active = false })
  summary.value = undefined
  error.value = false
  const { roundStatistics, data, now } = props.context
  try {
    const [history, shop] = await Promise.all([data.history.read(), data.rewardShop()])
    if (active) {
      summary.value = endingSummary(runId, roundStatistics, history, shop, now)
    }
  } catch (cause) {
    console.error('读取生日结算记录失败', cause)
    if (active) {
      error.value = true
    }
  }
}, { immediate: true })

/**
 * 提交结算给主线，永久权限与成就由存档事务统一写入
 *
 * @date 2026/11/24 19:09
 */
function enterHouse() {
  if (props.completionPending || !summary.value) {
    return
  }
  emit('completed', { status: 'completed' })
}
</script>

<template>
  <section class="ending" aria-labelledby="ending-title">
    <header class="ending-head">
      <div class="celebration">
        <svg class="celebration-frame" viewBox="0 0 384 156" fill="none" aria-hidden="true">
          <path d="M84 121C57 82 83 32 143 19c49-11 111-3 143 23 28 23 35 65 8 86-37 28-178 30-210-7Z" fill="#ffebbd" opacity=".75"/>
          <path d="M62 117q-17-8-29-4m22-22-12-7m281-3 16-8m-21 28 22-2M81 50l-9-12m241 14 9-12" stroke="#d6a05a" stroke-width="2.7" stroke-linecap="round"/>
          <path d="M99 27q3 11 11 12-9 3-10 13-3-9-11-11 9-3 10-14ZM302 15q1 9 9 11-7 1-9 9-1-7-8-9 6-2 8-11Z" stroke="#c99353" stroke-width="1.7" stroke-linejoin="round"/>
          <path d="M54 62c-4-5-18-13-16-20 2-6 11-5 15 3 4-7 13-7 15-1 2 7-10 13-14 18Zm282 51c4-7 10-10 15-7 5 5-4 12-12 16-6-5-11-11-8-15 2-2 4 0 5 6Z" fill="#f6b4a4" stroke="#b97a60" stroke-width="1.55"/>
          <path d="M108 131q74 18 162 0" stroke="#cf985f" stroke-width="1.65" stroke-dasharray="2 6" stroke-linecap="round"/>
          <circle cx="74" cy="68" r="2.8" fill="#e6ab82"/><circle cx="311" cy="68" r="2.8" fill="#e6ab82"/>
          <circle cx="117" cy="18" r="2.6" fill="#daa260"/><circle cx="273" cy="30" r="2.5" fill="#d39a75"/>
        </svg>
        <img v-if="art" :src="art" :alt="pairLabel" width="320" height="270" draggable="false" />
      </div>
      <h1 id="ending-title">生日快乐签收成功！</h1>
      <p>你的生日冒险圆满完成啦。</p>
    </header>

    <div v-if="summary" class="keepsake">
      <dl class="receipt" aria-label="本轮冒险纪念">
        <div v-for="row in summary.rows" :key="row.label" class="receipt-line">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>

      <div class="award">
        <svg class="medal" viewBox="0 0 54 56" fill="none" aria-hidden="true">
          <path d="m15 29-7 21 10-4 5 6 6-18m12-5 6 21-10-4-6 6-5-18" fill="#e9a38a" stroke="#b87557" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M26 3c6-3 8 4 12 4 5-1 5 4 7 6 5 3 2 7 2 10 1 4-3 6-5 8-1 5-6 4-9 6-4 4-8 0-11 0-4 1-7-3-9-5-4-1-5-5-5-8-3-4 0-8 2-10 0-5 5-5 8-7 1-4 5-3 8-4Z" fill="#f5c77b" stroke="#a96b3c" stroke-width="1.7"/>
          <circle cx="27" cy="20" r="13.3" fill="#ffe6a6" stroke="#c98c50" stroke-width="1.3"/>
          <path d="M23 22c3-4 6-4 9 0 5 7-8 7-10 5-2-1 0-4 1-5Z" fill="#a96b3c"/>
          <ellipse cx="21" cy="18" rx="2" ry="2.7" transform="rotate(-24 21 18)" fill="#a96b3c"/>
          <ellipse cx="26" cy="15.5" rx="2" ry="2.7" fill="#a96b3c"/>
          <ellipse cx="32" cy="17" rx="2" ry="2.6" transform="rotate(24 32 17)" fill="#a96b3c"/>
        </svg>
        <div>
          <p>{{ summary.starEarned ? '已珍藏的寿星成就' : '进入小屋后解锁' }}</p>
          <h2>{{ achievementNames['birthday-star'] }}</h2>
        </div>
      </div>

      <button v-if="context.mode !== 'collection'" class="enter" type="button" :disabled="completionPending"
        @click="enterHouse">进入我的生日小屋 <span aria-hidden="true">→</span></button>
    </div>
    <p v-else class="loading" role="status">{{ error ? '这次的冒险记录暂时打不开，请刷新重试。' : '正在整理这次冒险的纪念…' }}</p>
    <p v-if="context.mode === 'dev'" class="dev-note">开发测试记录</p>
  </section>
</template>

<style scoped>
.ending { --ink: #633f2f; --faded: #79583f; width: min(100%, 31rem); margin-inline: auto; color: var(--ink);
  padding: .4rem .18rem max(.6rem, env(safe-area-inset-bottom)); text-align: center; }
.ending-head { margin: 0 0 1rem; }
.celebration { position: relative; width: min(100%, 24rem); height: clamp(7.8rem, 20dvh, 10.2rem); margin: 0 auto .2rem;
  display: grid; place-items: center; }
.celebration-frame { position: absolute; width: 100%; height: 100%; }
.celebration img { width: min(66%, 15rem); height: 115%; object-fit: contain; position: relative;
  filter: drop-shadow(0 .16rem .08rem #764e3733); animation: birthday-hop .56s ease-out both; }
.ending h1 { display: inline-block; position: relative; isolation: isolate; margin: 0; padding-bottom: .28rem;
  font-size: clamp(1.5rem, 6.5vw, 2.15rem); font-weight: 900; line-height: 1.22; letter-spacing: .025em; }
.ending h1::after { position: absolute; content: ''; left: 5%; right: 7%; bottom: .03rem; height: .38rem; z-index: -1;
  border-top: .18rem solid #e4aa70; border-radius: 50%; transform: rotate(-2deg); }
.ending-head p { margin: .4rem 0 0; font-size: .93rem; color: var(--faded); }
.keepsake { position: relative; padding: .4rem clamp(.7rem, 3.5vw, 1.05rem) .9rem; border: 1px solid #dcb58e;
  border-radius: .67rem .87rem .63rem .95rem; background: #fff6e3; box-shadow: .18rem .22rem #d7a37936; }
.keepsake::before { content: ''; position: absolute; top: -.35rem; left: calc(50% - 2rem); width: 4rem; height: .68rem;
  transform: rotate(-4deg); background: repeating-linear-gradient(115deg,#efb38c99 0 .28rem,#ffe1b899 .28rem .55rem); }
.receipt { margin: .12rem 0 .68rem; text-align: left; }
.receipt-line { display: grid; grid-template-columns: minmax(max-content, 1fr) minmax(0, 1.35fr); align-items: baseline;
  gap: .55rem; padding: .35rem .08rem; border-bottom: 1px dashed #ddbd98; font-size: .9rem; }
.receipt-line dt { color: var(--ink); font-weight: 650; }
.receipt-line dd { margin: 0; text-align: right; color: #556442; font-weight: 720; overflow-wrap: anywhere; }
.award { display: flex; align-items: center; justify-content: center; gap: .55rem; padding: .36rem .24rem .42rem;
  border: 1px solid #e2b977; border-radius: .78rem .62rem .75rem .65rem; background: #ffebbe; color: #714726; }
.medal { width: 2.55rem; height: 2.69rem; flex: 0 0 auto; animation: stamp .35s .15s ease-out both; }
.award h2, .award p { margin: 0; }
.award h2 { font-size: clamp(1rem, 4.8vw, 1.27rem); line-height: 1.25; font-weight: 850; }
.award p { margin-bottom: .1rem; font-size: .73rem; }
.enter { display: flex; align-items: center; justify-content: center; gap: .55rem; width: 100%; min-height: 3rem;
  margin: .75rem 0 0; padding: .55rem .65rem; border: 1.5px solid #aa744a; border-radius: 1rem .91rem .92rem 1rem;
  background: #ffd28b; box-shadow: 0 .16rem #b9885d, inset 0 .11rem #fff1c6; color: #613e28; font-weight: 850; }
.enter:active { transform: translateY(.1rem); box-shadow: inset 0 .11rem #fff1c6; }
.dev-note, .loading { margin: .65rem 0 0; color: var(--faded); font-size: .76rem; }
@keyframes birthday-hop { 0% { opacity: 0; transform: translateY(.6rem) rotate(-5deg); }
  57% { opacity: 1; transform: translateY(-.27rem) rotate(2deg); } 100% { transform: translateY(0); } }
@keyframes stamp { from { opacity: .4; transform: rotate(-15deg) scale(1.25); } to { opacity: 1; transform: rotate(-6deg); } }
@media (prefers-reduced-motion: reduce) {
  .celebration img, .medal { animation: none; }
}
</style>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { assets } from '../../config/assets'
import { dialogue } from '../../config/dialogue'
import { personal } from '../../config/personal'
import { chapters } from '../../config/storyFlow'
import { meetingMoment } from '../../core/story/meetingClock'
import HouseSettings from './HouseSettings.vue'
import HouseShelf from './HouseShelf.vue'
import HouseSticker from './HouseSticker.vue'
import type { HouseArchive, HousePage, ModuleProps, RevealedTickets } from './types'

const props = defineProps<ModuleProps>()
const page = ref<HousePage>('home')
const header = ref<HTMLElement>()
const archive = shallowRef<HouseArchive>()
const tickets = shallowRef<RevealedTickets>([])
const marks = ref(0)
const error = ref('')
const confirmReplay = ref(false)
const timeOffset = props.context.mode === 'dev' ? props.context.now - Date.now() : 0
const now = ref(Date.now() + timeOffset)
const moment = computed(() => meetingMoment(personal.meetingAt, now.value))
const best = computed(() => archive.value?.results.reduce((score, result) => result.kind === 'catch-gifts'
  && result.status === 'completed' && result.score !== undefined ? Math.max(score ?? 0, result.score) : score,
undefined as number | undefined))
const dogPath = assets.dogs.maltese['collection-welcome-pair']
  ?? (import.meta.env.DEV ? '__birthday_dev_collection/pair-welcome.png' : undefined)
const dogs = dogPath ? import.meta.env.BASE_URL + dogPath : undefined
const pairLabel = personal.maltese + '和' + personal.sender + '在小屋贴贴'
const tiles = [
  { page: 'albums', label: '回忆相册' }, { page: 'bouquet', label: '我的花束' }, { page: 'cake', label: '我的蛋糕' },
  { page: 'games', label: '小游戏' }, { page: 'gifts', label: '兑换券' }, { page: 'letter', label: '生日来信' },
] as const
const navigation = [
  { page: 'home', label: '小屋' }, { page: 'games', label: '游戏' },
  { page: 'collection', label: '收藏' }, { page: 'gifts', label: '礼物' },
] as const
let timer: ReturnType<typeof setInterval> | undefined
let disposed = false

onMounted(() => {
  void readHistory()
  timer = setInterval(() => { now.value = Date.now() + timeOffset }, 1000)
})
onUnmounted(() => {
  disposed = true
  clearInterval(timer)
})

/**
 * 读取收藏、奖券和章节纪念章
 *
 * @date 2026/11/24 19:31
 */
async function readHistory() {
  try {
    const { history, rewardShop } = props.context.data
    const [records, shop, chapterMarks] = await Promise.all([history.read(), rewardShop(), history.chapterMarks()])
    if (!disposed) {
      archive.value = records
      tickets.value = shop.revealed
      marks.value = chapterMarks
    }
  } catch (cause) {
    console.error('读取生日小屋收藏失败', cause)
    if (!disposed) {
      error.value = '暂时打不开收藏，请刷新再试。'
    }
  }
}

/**
 * 切换小屋分区并把焦点带到新的内容开头
 *
 * @date 2026/11/24 19:31
 * @param target 要显示的分区
 */
async function show(target: HousePage) {
  page.value = target
  confirmReplay.value = false
  await nextTick()
  header.value?.focus({ preventScroll: true })
  header.value?.scrollIntoView({ block: 'start' })
}

/**
 * 在小屋收藏中保存作品的喜欢状态
 *
 * @date 2026/11/24 19:31
 * @param id 作品 ID
 * @param value 要保存的喜欢状态
 */
async function favorite(id: string, value: boolean) {
  error.value = ''
  try {
    await props.context.data.history.favoriteWork(id, value)
    await readHistory()
  } catch (cause) {
    console.error('保存作品喜欢状态失败', cause)
    error.value = '喜欢状态未保存，请重试。'
  }
}

/**
 * 保存页首的音乐开关
 *
 * @date 2026/11/24 19:31
 */
async function toggleMusic() {
  const controls = props.houseControls
  if (!controls) {
    return
  }
  error.value = ''
  try {
    await controls.updateSettings({ music: !controls.settings.music })
  } catch (cause) {
    console.error('保存小屋音乐开关失败', cause)
    error.value = '音乐设置没保存，请重试。'
  }
}

/**
 * 合并存档后读取最新档案和收藏
 *
 * @date 2026/11/24 19:31
 */
async function refresh() {
  try {
    await props.houseControls?.refresh()
    await readHistory()
  } catch (cause) {
    console.error('刷新已合并的生日小屋存档失败', cause)
    error.value = '刷新页面即可查看已合并的记录。'
  }
}

/**
 * 确认重新开始后交给主控创建新轮次
 *
 * @date 2026/11/24 19:31
 */
function restart() {
  confirmReplay.value = false
  props.houseControls?.replay('start')
}
</script>

<template>
  <section class="house" aria-label="永久生日小屋">
    <header ref="header" tabindex="-1" class="house-top">
      <button v-if="page !== 'home'" type="button" class="top-link" @click="show('home')">‹ 返回小屋</button>
      <span v-else class="top-name">生日小屋</span>
      <div class="top-actions">
        <button v-if="houseControls" class="icon-button" type="button" :aria-pressed="houseControls.settings.music"
          :aria-label="houseControls.settings.music ? '关闭音乐' : '开启音乐'" @click="toggleMusic">♪</button>
        <button v-if="houseControls && context.data.backup" class="icon-button" type="button"
          aria-label="小屋设置" @click="show('settings')">⚙</button>
      </div>
    </header>

    <template v-if="page === 'home'">
      <div class="welcome">
        <div class="sunny-window" aria-hidden="true"></div>
        <span class="sparkle left" aria-hidden="true">✧</span>
        <span class="sparkle right" aria-hidden="true">♡</span>
        <img v-if="dogs" :src="dogs" :alt="pairLabel" width="320" height="270" draggable="false" />
      </div>
      <h1>欢迎回到你的生日小屋</h1>
      <p class="welcome-note">生日只有一天，但快乐可以一直保存。</p>

      <div v-if="moment.countdown" class="countdown" role="timer" aria-label="距离周末见面">
        <div v-for="(unit, index) in ['天', '小时', '分钟']" :key="unit">
          <strong>{{ String(moment.countdown[index]).padStart(2, '0') }}</strong><span>{{ unit }}</span>
        </div>
      </div>
      <p v-else-if="moment.date" class="meeting-line">{{ dialogue.meeting[moment.stage] }}</p>

      <div class="tile-grid">
        <button v-for="tile in tiles" :key="tile.page" type="button" :class="tile.page"
          @click="show(tile.page)"><HouseSticker :kind="tile.page" /><span>{{ tile.label }}</span></button>
      </div>

      <dl v-if="archive" class="house-stats">
        <div><dt>纪念章</dt><dd>{{ marks }}/{{ chapters.length }}</dd></div>
        <div><dt>DIY 作品</dt><dd>{{ archive.works.length }}</dd></div>
        <div><dt>游戏最高分</dt><dd>{{ best ?? '—' }}</dd></div>
      </dl>
      <p v-if="archive" class="replay-count">已完成 {{ archive.completions.length }} 次生日冒险</p>
      <div v-if="houseControls" class="replay">
        <template v-if="confirmReplay">
          <p>{{ dialogue.replay.prompt }}</p>
          <button type="button" :disabled="houseControls.busy" class="replay-confirm" @click="restart">{{ dialogue.replay.confirm }}</button>
          <button type="button" @click="confirmReplay = false">{{ dialogue.replay.cancel }}</button>
        </template>
        <template v-else>
          <button v-if="houseControls.canResume" type="button" :disabled="houseControls.busy"
            @click="houseControls.replay('resume')">继续上次冒险</button>
          <button type="button" :disabled="houseControls.busy" @click="confirmReplay = true">↻ 重新开始冒险</button>
        </template>
      </div>
    </template>
    <HouseSettings v-else-if="page === 'settings' && houseControls && context.data.backup"
      :controls="houseControls" :backup="context.data.backup" @imported="refresh" />
    <HouseShelf v-else-if="archive" :page="page" :history="archive" :tickets="tickets" :photos="context.photos.photos" :now="now"
      @open="(target, selection) => houseControls?.openModule(target, selection)" @show="show" @favorite="favorite" />
    <p v-else-if="!error" role="status">正在翻开收藏…</p>
    <p v-if="error" class="problem" role="status">{{ error }}</p>

    <nav class="house-nav" aria-label="生日小屋导航">
      <button v-for="item in navigation" :key="item.page" type="button"
        :aria-current="page === item.page ? 'page' : undefined" @click="show(item.page)">{{ item.label }}</button>
    </nav>
  </section>
</template>

<style scoped>
.house { --house-ink: #67452f; --house-muted: #765a43; width: min(100%,30rem); margin: 0 auto; color: var(--house-ink);
  padding: .08rem .15rem 0; min-height: min(85dvh,49rem); display: flex; flex-direction: column; text-align: center; }
.house-top { display: flex; align-items: center; justify-content: space-between; min-height: 44px; scroll-margin-top: env(safe-area-inset-top); }
.house-top:focus { outline: none; }
.top-name { color: var(--house-muted); font-size: .86rem; font-weight: 730; letter-spacing: .09em; }
.top-actions { display: flex; }
.icon-button, .top-link { min-width: 44px; color: #735337; border: 0; background: transparent; padding: 0 .29rem; }
.icon-button { font-size: 1.15rem; }
.icon-button[aria-pressed="false"] { opacity: .55; }
.top-link { font-weight: 720; font-size: .88rem; }
.welcome { position: relative; isolation: isolate; height: clamp(6.3rem, 17dvh, 9rem); width: 100%; margin: 0 0 .43rem;
  display: grid; place-items: center; }
.sunny-window { position: absolute; z-index: -1; inset: 0 11% .16rem; transform: rotate(-2deg);
  border: 1px solid #e3b77d; border-radius: 49% 51% 45% 55% / 57% 53% 47% 43%;
  background: radial-gradient(ellipse at 48% 38%,#fff5d4,#ffe6b7 72%); box-shadow: inset 0 0 0 .24rem #fff0cd; }
.welcome img { height: 130%; width: min(75%,16rem); object-fit: contain; filter: drop-shadow(0 .15rem .1rem #69433038);
  position: absolute; top: -14%; animation: welcome-in .5s ease-out both; }
.sparkle { position: absolute; top: 28%; font-size: 1.6rem; line-height: 1; }
.sparkle.left { left: 12%; color: #ae753f; transform: rotate(-12deg); }
.sparkle.right { right: 10%; color: #ae6255; transform: rotate(14deg); }
h1 { font-size: clamp(1.37rem,6.15vw,1.95rem); line-height: 1.24; font-weight: 900; margin: .16rem 0; }
.welcome-note { margin: .27rem 0 .66rem; color: var(--house-muted); font-size: clamp(.78rem, 3.6vw, .95rem); }
.countdown, .tile-grid, .house-stats { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .48rem; }
.countdown { margin: 0 0 .64rem; }
.countdown div { display: grid; padding: .29rem .16rem .25rem; border: 1px solid #e2bc88; border-radius: .75rem .63rem .68rem .7rem;
  background: #faeac7; color: #805635; }
.countdown strong { font-size: clamp(1.27rem,5.8vw,1.66rem); line-height: 1.05; font-variant-numeric: tabular-nums; }
.countdown span { font-size: .7rem; }
.meeting-line { margin: 0 0 .66rem; padding: .35rem; color: #735337; border-block: 1px dashed #dfba8f; }
.tile-grid button { display: grid; align-content: center; justify-items: center; gap: .12rem; min-height: clamp(4.35rem, 10.7dvh, 5.75rem);
  padding: .25rem .15rem; border: 1px solid #b8825d66; border-radius: .83rem 1rem .83rem .9rem; color: #614736; background: #f3dfca;
  box-shadow: .11rem .13rem #be925e29; font-size: clamp(.78rem,3.7vw,.97rem); font-weight: 750; }
.tile-grid button:active { transform: translateY(2px); box-shadow: none; }
.tile-grid .bouquet { background: #e0e8cd; }.tile-grid .cake { background: #f3dce0; }
.tile-grid .games { background: #e2e6ed; }.tile-grid .gifts { background: #f7e8bd; }.tile-grid .letter { background: #ebe1eb; }
.house-stats { margin: .75rem 0 .19rem; }
.house-stats div { display: flex; flex-direction: column-reverse; }
.house-stats dd { margin: 0; line-height: 1.17; color: #566745; font-size: clamp(1.13rem,5.3vw,1.55rem); font-weight: 850; }
.house-stats dt, .replay-count { color: var(--house-muted); font-size: .72rem; }
.replay-count { margin: .15rem 0 0; }
.replay { text-align: right; }
.replay p { margin: .3rem 0 0; font-size: .88rem; text-align: left; }
.replay button { border: 0; padding: .16rem .3rem; background: transparent; color: #775237; font-size: .79rem; }
.replay .replay-confirm { color: #704524; font-weight: 850; }
.problem { font-size: .84rem; text-align: left; }
.house-nav { position: sticky; bottom: 0; z-index: 2; display: grid; grid-template-columns: repeat(4,minmax(0,1fr));
  margin-top: auto; border-top: 1px solid #dcc4a6; padding-bottom: env(safe-area-inset-bottom); background: #fff6e7f7; }
.house-nav button { background: transparent; border: 0; color: #556343; font-size: .91rem; min-height: 46px; }
.house-nav button[aria-current="page"] { font-weight: 850; text-decoration: underline; text-underline-offset: .27rem; }
@keyframes welcome-in { from { opacity: 0; transform: translateY(.35rem) rotate(-4deg); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .welcome img { animation: none; } }
</style>

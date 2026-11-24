<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { dialogue } from '../../config/dialogue'
import { personal } from '../../config/personal'
import type { ModuleCompletion } from '../../core/story/contract'
import MeetingScene from './MeetingScene.vue'
import { meetingMoment } from '../../core/story/meetingClock'
import type { MeetingDraft, ModuleProps } from './types'

const { context } = defineProps<ModuleProps>()
const emit = defineEmits<{ completed: [result: ModuleCompletion] }>()
const letterOpened = ref(context.draft?.letterOpened === true)
const sceneSeen = ref(letterOpened.value || context.draft?.sceneSeen === true)
const letterHeading = ref<HTMLElement>()
const saving = ref(false)
const saveError = ref(false)
const countdownUnits = ['天', '时', '分', '秒']
const [invitationLead, invitationClose] = dialogue.meeting.invitation.split('。')
const letterBody = dialogue.letter.slice(0, -1)
const signature = dialogue.letter[dialogue.letter.length - 1]

// 开发场景可偏移时钟，正式剧情和重玩始终读取本机绝对时间
const offset = context.mode === 'dev' ? context.now - Date.now() : 0
const now = ref(Date.now() + offset)
const moment = computed(() => meetingMoment(personal.meetingAt, now.value))
let clock: number | undefined
let writes = Promise.resolve(true)

onMounted(() => {
  clock = window.setInterval(() => { now.value = Date.now() + offset }, 250)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    settleScene()
  }
})
onUnmounted(() => window.clearInterval(clock))

/**
 * 串行记录场景和信件进度，避免较早的动画进度覆盖开信进度
 *
 * @date 2026/11/24 18:48
 * @return 本次进度是否保存成功
 */
function saveProgress() {
  if (context.mode === 'collection') {
    return writes
  }
  const draft: MeetingDraft = { sceneSeen: sceneSeen.value, letterOpened: letterOpened.value }
  writes = writes.then(async () => {
    try {
      await context.data.saveDraft({ ...draft })
      saveError.value = false
      return true
    } catch (error) {
      console.error('保存周末见面站进度失败', error)
      saveError.value = true
      return false
    }
  })
  return writes
}

/**
 * 完成或跳过入场动画，保留两只小狗停在路上的状态
 *
 * @date 2026/11/24 18:48
 */
function settleScene() {
  if (sceneSeen.value) {
    return
  }
  sceneSeen.value = true
  void saveProgress()
}

/**
 * 展开签收的信件，并把视线带到信纸开头
 *
 * @date 2026/11/24 18:48
 */
async function openLetter() {
  sceneSeen.value = true
  letterOpened.value = true
  void saveProgress()

  await nextTick()
  letterHeading.value?.focus({ preventScroll: true })
  letterHeading.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

/**
 * 保存签收进度后交由主线推进
 *
 * @date 2026/11/24 18:48
 */
async function finish() {
  if (saving.value || !letterOpened.value) {
    return
  }
  saving.value = true
  if (!await writes && !await saveProgress()) {
    saving.value = false
    return
  }
  emit('completed', { status: 'completed', statistics: { letterOpened: true } })
  saving.value = false
}
</script>

<template>
  <section class="meeting" aria-labelledby="meeting-title">
    <header class="chapter">
      <p><span aria-hidden="true"></span> CHAPTER 06 · 周末见面站 <span aria-hidden="true"></span></p>
      <h1 id="meeting-title">{{ dialogue.meeting[moment.stage] }}<span class="title-mark" aria-hidden="true">♡</span></h1>
    </header>

    <div class="scene-page">
      <MeetingScene :settled="sceneSeen" @landed="settleScene" />
      <button v-if="!sceneSeen" class="skip" type="button" @click="settleScene">跳过动画 <span aria-hidden="true">»</span></button>
    </div>

    <div class="invitation">
      <span class="sprig left" aria-hidden="true">✧</span>
      <p>{{ invitationLead }}。<br />{{ invitationClose }}。</p>
      <span class="sprig right" aria-hidden="true">✧</span>
    </div>

    <div v-if="moment.date" class="appointment">
      <time :datetime="personal.meetingAt">{{ moment.date }} · 北京时间</time>
      <div v-if="moment.countdown" class="countdown" role="timer" aria-label="距离见面">
        <div v-for="(value, index) in moment.countdown" :key="countdownUnits[index]" class="count">
          <strong>{{ String(value).padStart(2, '0') }}</strong><span>{{ countdownUnits[index] }}</span>
        </div>
      </div>
    </div>

    <div class="letter-section">
      <button v-if="!letterOpened" type="button" class="seal-button" @click="openLetter">
        <span class="envelope-icon" aria-hidden="true">♡</span> 领取最后一份生日祝福
      </button>
      <Transition name="unfold">
        <article v-if="letterOpened" class="letter" aria-labelledby="meeting-letter-title">
          <h2 id="meeting-letter-title" ref="letterHeading" tabindex="-1">生日信</h2>
          <p v-for="line in letterBody" :key="line">{{ line }}</p>
          <p class="signature">{{ signature }}</p>
          <span class="letter-heart" aria-hidden="true">♡</span>
          <button v-if="context.mode !== 'collection'" type="button" class="seal-button finish" :disabled="saving"
            @click="finish">完成签收 <span aria-hidden="true">→</span></button>
        </article>
      </Transition>
      <p v-if="saveError" class="save-error" role="status">
        进度暂未保存。<button class="retry" type="button" @click="saveProgress">重试</button>
      </p>
    </div>
  </section>
</template>

<style scoped>
.meeting { --meeting-ink: #68432f; --meeting-muted: #805639; color: var(--meeting-ink); max-width: 31rem;
  margin-inline: auto; padding: max(.45rem, env(safe-area-inset-top)) .12rem max(.65rem, env(safe-area-inset-bottom)); text-align: center; }
.chapter { padding: .7rem .15rem .8rem; padding-block: clamp(.7rem, 2.2dvh, 1.6rem) clamp(.8rem, 2.4dvh, 1.65rem); }
.chapter p { display: flex; gap: .55rem; align-items: center; justify-content: center; margin: .2rem 0 .55rem;
  color: var(--meeting-muted); font-size: .76rem; font-weight: 750; letter-spacing: .11em; }
.chapter p span { width: 1.35rem; border-top: 1.5px solid #ca9b72; }
.chapter h1 { position: relative; display: inline-block; isolation: isolate; margin: 0; padding: 0 .15rem .22rem;
  font-size: clamp(1.35rem, 6.1vw, 2rem); font-weight: 900; line-height: 1.27; letter-spacing: -.035em; text-wrap: balance; }
.chapter h1::after { content: ''; position: absolute; left: 9%; right: 14%; bottom: -.02rem; height: .27rem;
  border-top: .17rem solid #eab375; border-radius: 57% 43% 38% 53%; transform: rotate(-2deg); z-index: -1; }
.title-mark { color: #bf735e; font-size: .92em; padding-left: .26rem; white-space: nowrap; }
.scene-page { position: relative; margin: .42rem .15rem 0; }
.skip { position: absolute; right: .45rem; bottom: .22rem; display: inline-flex; align-items: center; gap: .18rem; min-height: 44px;
  padding-inline: .6rem; border: 0; border-radius: .55rem; color: #64452f; background: #fff2dcef; font: inherit; font-size: .75rem; cursor: pointer; }
.invitation { position: relative; margin: .78rem auto .45rem; padding: .36rem 1.28rem .52rem; width: min(100%, 27rem);
  background: #fff3d9; border: 1px solid #e5bc87; border-radius: 48% 48% 1rem 1rem / 12% 12% 1rem 1rem; }
.invitation p { margin: 0; font-size: clamp(.85rem, 4vw, 1.06rem); line-height: 1.58; font-weight: 700; }
.sprig { position: absolute; top: 36%; color: #b87a58; font-size: 1.18rem; }
.sprig.left { left: .43rem; transform: rotate(-15deg); }
.sprig.right { right: .43rem; transform: rotate(15deg); }
.appointment { width: min(100%, 25rem); margin: .5rem auto .65rem; }
.appointment time { display: block; color: var(--meeting-muted); font-size: .78rem; font-weight: 650; }
.countdown { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .46rem; margin-top: .4rem; }
.count { display: flex; flex-direction: column; gap: .08rem; align-items: center; position: relative; padding: .35rem .1rem .28rem;
  border: 1px solid #e4b67d; border-radius: .6rem .55rem .54rem .62rem; background: #fff2d8;
  box-shadow: 0 .13rem 0 #bd8a5e29, inset 0 0 0 .14rem #ffe8c3; }
.count strong { color: #8a4d2d; font-weight: 800; font-size: clamp(1.45rem, 7vw, 2.03rem);
  line-height: 1.05; font-variant-numeric: tabular-nums; }
.count span { font-size: .77rem; }
.letter-section { position: relative; margin: .85rem auto 0; margin-top: clamp(.85rem, 2.4dvh, 1.45rem); }
.seal-button { display: inline-flex; min-height: 3rem; max-width: 100%; gap: .48rem; align-items: center; justify-content: center;
  padding: .64rem 1.05rem; border: 1.5px solid #bc8153; border-radius: 1rem .88rem 1rem .87rem; background: #ffd48b;
  box-shadow: 0 .18rem 0 #c08454, inset 0 .13rem #fff0c1; color: #633921; font: inherit; font-weight: 850; cursor: pointer; }
.seal-button:active { transform: translateY(.12rem); box-shadow: inset 0 .13rem #fff0c1; }
.envelope-icon { position: relative; display: inline-grid; place-items: center; width: 1.44rem; height: 1.05rem;
  border: 1.3px solid #a96945; border-radius: .19rem; background: #fff0c5; color: #a85f4d; font-size: .78rem; line-height: 1; }
.letter { position: relative; isolation: isolate; margin: 1rem .12rem .3rem; padding: 1rem clamp(.95rem, 5vw, 1.6rem) 1.15rem; border: 1px solid #d5a779;
  border-radius: .51rem .72rem .45rem .62rem; background: repeating-linear-gradient(transparent 0 1.61rem, #dbb07b38 1.61rem 1.66rem), #fff8e5;
  box-shadow: .22rem .28rem 0 #dfad7b59; text-align: left; transform-origin: top center; }
.letter::before { content: ''; position: absolute; z-index: -1; top: -.55rem; left: 38%; width: 24%; height: 1.25rem;
  background: repeating-linear-gradient(115deg, #f5cca89c 0 .32rem, #ffecce9c .32rem .62rem); transform: rotate(-5deg); }
.letter h2 { margin: 0 0 .32rem; scroll-margin-top: max(1.2rem, env(safe-area-inset-top)); font-size: 1.34rem; text-align: center; }
.letter p { margin: 0 0 .75rem; line-height: 1.7; font-size: .94rem; }
.letter .signature { text-align: right; font-weight: 800; padding-right: .28rem; }
.letter-heart { color: #bd735d; font-size: 2.1rem; line-height: 1; position: absolute; left: 1.14rem;
  bottom: 1.3rem; transform: rotate(-14deg); }
.finish { display: flex; width: max-content; margin: .7rem 0 0 auto; }
.save-error { font-size: .85rem; color: #7a4932; }
.retry { min-height: 44px; color: inherit; background: transparent; border: 0; font: inherit; text-decoration: underline; }
.unfold-enter-active { animation: unfold .36s ease-out both; }
@keyframes unfold { from { opacity: 0; transform: perspective(500px) rotateX(-29deg) translateY(-.65rem); }
  to { opacity: 1; transform: perspective(500px) rotateX(0); } }
@media (prefers-reduced-motion: reduce) { .unfold-enter-active { animation: none; } }
</style>

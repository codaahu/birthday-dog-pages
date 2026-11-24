<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { assets, type Dog } from '../../config/assets'
import { dialogue } from '../../config/dialogue'
import { personal } from '../../config/personal'
import type { ModuleCompletion } from '../../core/story/contract'
import AchievementToast from '../../shared/AchievementToast.vue'
import { useAchievementToast } from '../../shared/useAchievementToast'
import OpeningStage from './OpeningStage.vue'
import { faceForPage, restoredPage } from './flow'
import type { DogPose, ModuleProps } from './types'

const props = defineProps<ModuleProps>()
const emit = defineEmits<{ completed: [result: ModuleCompletion]; 'dialogue-ready': [] }>()
const lines = computed(() => props.context.replay ? [dialogue.opening.replay] : dialogue.opening.lines)
const page = ref(restoredPage(props.context.draft?.page, lines.value.length))
const entering = ref(false)
const unsealing = ref(false)
const motion = ref(false)
const heartBurst = ref(0)
const poses = reactive<Record<Dog, DogPose>>({ golden: 'happy', maltese: 'happy' })
const taps = reactive<Record<Dog, number>>({ golden: 0, maltese: 0 })
const pets = ref(0)
const busy = ref(false)
const savingAchievement = ref(false)
const errorMessage = ref('')
const { visible: newAchievement, notify } = useAchievementToast()
let petAchievementChecked = false
const dialogueButton = ref<HTMLButtonElement>()
const cover = computed(() => page.value === 0 || unsealing.value)
const speaker = computed(() => cover.value ? undefined : faceForPage(page.value, props.context.replay))
const speakerName = computed(() => speaker.value === 'maltese' ? personal.maltese : personal.sender)
const localPreview = import.meta.env.DEV
const localArtworkNote = localPreview && (!assets.dogs.golden.happy || !assets.dogs.maltese.happy)
  ? '官方角色图 · 网页授权待确认' : undefined
const wasOpenedHere = ref(false)
let introTimer: ReturnType<typeof setTimeout> | undefined
let letterTimer: ReturnType<typeof setTimeout> | undefined
let idleTimer: ReturnType<typeof setTimeout> | undefined
let motionPreference: MediaQueryList | undefined

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motion.value = !motionPreference.matches
  motionPreference.addEventListener?.('change', changeMotion)
  if (page.value === 0 && motion.value) {
    entering.value = true
    introTimer = setTimeout(stopEntrance, 5000)
  }
  scheduleSleep()
})

onUnmounted(() => {
  motionPreference?.removeEventListener?.('change', changeMotion)
  clearTimeout(introTimer)
  clearTimeout(letterTimer)
  clearTimeout(idleTimer)
})

watch(cover, async (visible) => {
  if (!visible && props.context.mode === 'story') {
    emit('dialogue-ready')
  }
  if (!visible && wasOpenedHere.value) {
    await nextTick()
    dialogueButton.value?.focus({ preventScroll: true })
  }
}, { immediate: true })

watch(speaker, (dog) => {
  if (dog && poses[dog] === 'sleep') {
    poses[dog] = 'happy'
  }
})

/**
 * 响应系统动效设置变化，减少动效时立即结束正在播放的分镜
 *
 * @date 2026/11/24 12:25
 * @param event 系统媒体查询变化
 */
function changeMotion(event: MediaQueryListEvent) {
  motion.value = !event.matches
  if (!motion.value) {
    skipMotion()
  }
}

/**
 * 停止角色入场并保持最终站位
 *
 * @date 2026/11/24 12:25
 */
function stopEntrance() {
  clearTimeout(introTimer)
  entering.value = false
}

/**
 * 跳过当前动效，已保存的对白照常显示
 *
 * @date 2026/11/24 12:25
 */
function skipMotion() {
  stopEntrance()
  clearTimeout(letterTimer)
  unsealing.value = false
}

/**
 * 重置两只小狗的空闲计时
 *
 * @date 2026/11/24 12:25
 */
function scheduleSleep() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    poses.golden = 'sleep'
    poses.maltese = 'sleep'
  }, 15000)
}

/**
 * 让被触摸的角色反馈，累计到十次保存摸狗成就
 *
 * @date 2026/11/24 13:56
 * @param dog 被摸到的角色
 */
async function pet(dog: Dog) {
  const sleeping = poses[dog] === 'sleep'
  scheduleSleep()
  taps[dog] += 1
  pets.value += 1
  poses[dog] = sleeping ? 'happy' : pets.value === 5 ? 'lie' : 'wag'
  if (pets.value >= 10 && !petAchievementChecked && !savingAchievement.value) {
    savingAchievement.value = true
    try {
      const isNew = await props.context.data.history.unlock('dog-petting', props.context.runId)
      petAchievementChecked = true
      if (isNew) {
        notify('dog-petting')
      }
      errorMessage.value = ''
    } catch (error) {
      console.error('保存摸狗成就失败', error)
      errorMessage.value = '成就还没存好，可以再摸一下重试。'
    } finally {
      savingAchievement.value = false
    }
  }
}

/**
 * 播放拆信或推进对白，存档写入与分镜并行
 *
 * @date 2026/11/24 12:25
 */
async function advance() {
  if (busy.value || unsealing.value) {
    return
  }
  errorMessage.value = ''
  stopEntrance()
  scheduleSleep()
  if (page.value === lines.value.length) {
    emit('completed', { status: 'completed' })
    return
  }

  const openingLetter = page.value === 0
  if (openingLetter) {
    wasOpenedHere.value = true
    if (motion.value) {
      unsealing.value = true
      letterTimer = setTimeout(skipMotion, 1550)
    }
  }

  busy.value = true
  try {
    const next = page.value + 1
    await props.context.data.saveDraft({ page: next })
    page.value = next
  } catch (error) {
    console.error('保存开场对白进度失败', error)
    if (openingLetter) {
      skipMotion()
    }
    errorMessage.value = '对白进度还没存好，请再点一次。'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="opening" :class="{ 'opening-letter': !cover }" :data-scene="unsealing ? 'unseal' : cover ? 'cover' : 'dialogue'">
    <div v-if="cover" class="postmark" aria-label="生日来信">
      <span>FOR MY FAVORITE GIRL</span>
      <svg viewBox="0 0 48 28" aria-hidden="true" focusable="false">
        <path d="M1 7c7-8 17 8 26 0m-26 8c7-8 17 8 26 0m-26 8c7-8 17 8 26 0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" />
        <circle cx="36" cy="14" r="10" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="2 2" />
        <path d="M36 12c-3-4-7 1 0 5 7-4 3-9 0-5Z" fill="currentColor" />
      </svg>
    </div>

    <header class="opening-header">
      <p v-if="cover" class="kicker">您有一份特殊快递</p>
      <h1>{{ cover ? dialogue.opening.title : '生日来信' }}</h1>
    </header>

    <OpeningStage :cover="cover" :preview="localPreview" :entering="entering" :unsealing="unsealing"
      :speaker="speaker" :pose="poses" :taps="taps" :heart-burst="heartBurst" :busy="busy || unsealing"
      @open="advance" @pet="pet" @heart="heartBurst += 1" />

    <div v-if="cover" class="cover-actions">
      <p class="subtitle">{{ dialogue.opening.subtitle }}</p>
      <button type="button" class="primary" :disabled="busy || unsealing" @click="advance">
        {{ unsealing ? '正在拆信…' : dialogue.opening.action }}
      </button>
      <p class="sender">由{{ personal.signature }}寄出</p>
    </div>

    <div v-else class="letter-actions">
      <div class="dialogue" aria-live="polite" aria-atomic="true">
        <article :key="page" class="bubble" :class="speaker">
          <p class="speaker">{{ speakerName }}</p>
          <p class="line">{{ lines[page - 1] }}</p>
        </article>
      </div>
      <button ref="dialogueButton" type="button" class="primary" :disabled="busy" @click="advance">
        {{ page === lines.length ? '开启生日冒险！' : '继续听' }}
      </button>
    </div>

    <AchievementToast :achievement="newAchievement" />
    <p v-if="errorMessage" class="status error" role="alert">{{ errorMessage }}</p>

    <div class="understory">
      <button v-if="entering || unsealing" type="button" class="skip" @click="skipMotion">跳过动画</button>
      <small v-if="localArtworkNote" class="art-note">{{ localArtworkNote }}</small>
    </div>
  </section>
</template>

<style scoped>
.opening {
  position: relative;
  width: min(100%, 27rem);
  margin-inline: auto;
  isolation: isolate;
  padding: 1rem clamp(.2rem, 1.3vw, .55rem) 0;
  text-align: center;
  border-radius: 1.9rem;
  background: radial-gradient(ellipse at 52% 33%, #fffdf6 10%, #fff8ed 62%, var(--cream) 92%);
}
.postmark { display: flex; align-items: center; justify-content: space-between; margin: 0 .25rem; color: #8f7659; font-size: .66rem; font-weight: 650; letter-spacing: .15em; }
.postmark svg { width: 2.5rem; height: 1.6rem; opacity: .74; }
.opening-header { position: relative; z-index: 1; padding-top: clamp(1.4rem, 5.4vw, 2rem); }
.kicker { margin: 0 0 .55rem; color: #897054; font-size: .85rem; letter-spacing: .115em; }
h1 { margin: 0; font-size: clamp(1.72rem, 7.15vw, 2.23rem); line-height: 1.25; font-weight: 860; letter-spacing: -.045em; color: #403630; }
.cover-actions, .letter-actions { width: min(100%, 22.25rem); margin: -.48rem auto 0; position: relative; z-index: 5; }
.subtitle { margin: .15rem 0 .92rem; color: #795f45; font-size: .9rem; }
.primary {
  width: 100%;
  min-height: 3.3rem;
  padding: .65rem 1.15rem;
  color: #45372c;
  background: #f4d99d;
  border: 1.6px solid #695139;
  border-radius: 100vw;
  box-shadow: 0 3px 0 #b58e5c40, inset 0 1.5px #fff1d5;
  font-size: 1.02rem;
  font-weight: 780;
}
.primary:active:not(:disabled) { transform: translateY(2px); box-shadow: inset 0 1.5px #fff1d5; }
.sender { margin: .65rem 0 0; color: #8d7457; font-size: .78rem; letter-spacing: .05em; }
.opening-letter { padding-top: .9rem; }
.opening-letter .opening-header { padding-top: .5rem; }
.opening-letter h1 { font-size: 1.15rem; font-weight: 690; letter-spacing: .17em; color: #866f56; }
.letter-actions { margin-top: -.3rem; }
.dialogue { min-height: 7.5rem; display: flex; align-items: flex-start; }
.bubble {
  position: relative;
  width: 94%;
  margin: 0 auto .8rem 0;
  padding: .68rem .95rem .76rem;
  background: #f3e4c8;
  border: 1px solid #d4ba8d;
  border-radius: .45rem 1.15rem 1.03rem 1.15rem;
  box-shadow: 0 3px 0 #b48f5830;
  text-align: left;
  animation: spoken .26s ease-out both;
}
.bubble::before { content: ''; position: absolute; width: .63rem; height: .63rem; top: -.34rem; left: 16%; background: inherit; border: solid #d4ba8d; border-width: 1px 0 0 1px; transform: rotate(45deg); border-radius: 1px; }
.bubble.maltese { margin-left: auto; margin-right: 0; background: #fffdf8; border-color: #e0cdb6; border-radius: 1.15rem .45rem 1.15rem 1.03rem; }
.bubble.golden::before { left: auto; right: 30%; }
.bubble.maltese::before { left: 27%; border-color: #e0cdb6; }
.speaker { margin: 0 0 .16rem; color: #795b40; font-size: .78rem; font-weight: 730; letter-spacing: .04em; }
.line { margin: 0; line-height: 1.66; text-wrap: pretty; font-size: .98rem; }
.status { margin: .5rem 0 0; color: #795b40; font-size: .84rem; }
.error { color: #973f49; }
.understory { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; column-gap: .55rem; padding-top: .18rem; min-height: 1.35rem; }
.art-note { color: #8b775e; font-size: .7rem; }
.skip { min-height: 44px; padding: .3rem .66rem; border: 0; background: transparent; color: #795f45; font-size: .79rem; text-decoration: underline; text-underline-offset: 3px; }
@keyframes spoken { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .bubble { animation: none; } }
</style>

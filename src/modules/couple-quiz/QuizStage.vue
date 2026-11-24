<script setup lang="ts">
import { computed } from 'vue'
import { assets, type Dog } from '../../config/assets'
import { personal } from '../../config/personal'
import type { QuizMood } from './types'

const props = defineProps<{ mood: QuizMood }>()

interface Pose {
  dog: Dog
  slot: 'maltese' | 'golden' | 'pair'
  name: string
}
const dogs: readonly Pose[] = [
  { dog: 'maltese', slot: 'maltese', name: personal.maltese },
  { dog: 'golden', slot: 'golden', name: personal.sender },
]
const pairName = personal.maltese + '和' + personal.sender
const poses: Record<QuizMood, readonly Pose[]> = {
  host: dogs,
  think: dogs,
  play: [{ dog: 'maltese', slot: 'pair', name: pairName }],
  warm: [{ dog: 'maltese', slot: 'pair', name: pairName }],
  result: [{ dog: 'golden', slot: 'pair', name: pairName }],
}

// 双人动作图保留同一对白色马尔济斯和黄色小金毛
const sprites = computed(() => poses[props.mood].map((pose) => {
  const action = 'quiz-' + props.mood + (pose.slot === 'pair' ? '-pair' : '')
  const configured = assets.dogs[pose.dog][action]
  const local = import.meta.env.DEV ? '__birthday_dev_quiz/' + pose.slot + '-' + props.mood + '.png' : undefined
  const path = configured ?? local
  return { ...pose, src: path ? import.meta.env.BASE_URL + path : undefined }
}))
</script>

<template>
  <div class="quiz-stage" :class="'mood-' + mood">
    <svg class="stage-art" viewBox="0 0 400 158" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="quiz-sky" x2="0" y2="1">
          <stop stop-color="#e9eee1" />
          <stop offset="1" stop-color="#fff2d9" />
        </linearGradient>
      </defs>

      <rect width="400" height="158" fill="url(#quiz-sky)" />
      <path d="M0 89q40-29 80-14 27-20 69-14 44 7 55 28m137-2q24-12 59 2" fill="#fff8e5" opacity=".9" />
      <path d="M0 126q64-14 138-8 57 8 120-3 76-12 142 2v41H0Z" fill="#d3debc" />
      <path d="M0 144q82-13 166-6 88 7 234-9v29H0Z" fill="#e6d3a0" opacity=".76" />
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-2 10q20 36 71 45m334-46q-24 36-69 43" stroke="#c09274" stroke-width="1.7" />
        <path d="M19 35l10 7-12 7Zm18 11 13 6-11 9Zm326 0-13 6 11 9Zm18-11-10 7 12 7Z" fill="#ebbbb1" stroke="#b88e74" stroke-width="1.1" />
        <path d="M61 92q2 9 9 11-7 2-9 10-2-7-9-10 7-2 9-11Zm283-9q2 8 8 10-6 2-8 8-2-6-8-8 6-2 8-10ZM110 28v10m-5-5h10m190-17v12m-6-6h12" stroke="#d8ac65" stroke-width="1.8" />
        <path d="M23 129q5 5 5 11m5-13-3 11m340-4 5-11m5 11 5-6" stroke="#82a080" stroke-width="1.65" />
      </g>
      <g v-if="mood === 'result'" class="quiz-lights" fill="#f4ca7e" stroke="#c18b57" stroke-width="1.5">
        <path d="m92 43 3 8 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1Zm217 21 3 8 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1Z" />
        <path d="M150 24l4 6m-6 0 6-6m88 12 8 5m-7 0 6-6" fill="none" stroke-linecap="round" />
      </g>
    </svg>

    <Transition name="quiz-pose" mode="out-in">
      <div :key="mood" class="sprite-layer">
        <img v-for="sprite in sprites.filter(({ src }) => Boolean(src))" :key="sprite.slot" :class="sprite.slot"
          :src="sprite.src" :alt="sprite.name" width="320" height="300" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.quiz-stage { position: relative; isolation: isolate; aspect-ratio: 400 / 158; border: 1px solid #d7c6a3; border-radius: 1.06rem 1.18rem .73rem .86rem; overflow: hidden; background: #e9eedf; box-shadow: 0 .19rem .45rem #85704a25; }
.stage-art, .sprite-layer { position: absolute; inset: 0; width: 100%; height: 100%; }
.sprite-layer { pointer-events: none; }
.sprite-layer img { position: absolute; object-fit: contain; filter: drop-shadow(0 .15rem 0 #70564245); }
.sprite-layer .maltese, .sprite-layer .golden { width: 54%; height: 126%; bottom: -16%; }
.sprite-layer .maltese { left: 4%; }
.sprite-layer .golden { right: 4%; }
.sprite-layer .pair { width: 86%; height: 156%; left: 7%; bottom: -27%; }
.mood-play .pair { height: 126%; left: 9%; bottom: 1%; }
.mood-warm .pair { bottom: -20%; }
.mood-think .golden { bottom: -24%; }
.mood-result .pair { height: 163%; bottom: -31%; }
.quiz-pose-enter-active, .quiz-pose-leave-active { transition: opacity .14s ease, transform .21s ease; }
.quiz-pose-enter-from { opacity: 0; transform: translateY(.25rem) scale(.98); }
.quiz-pose-leave-to { opacity: 0; transform: translateY(.18rem); }
.quiz-lights { transform-origin: center; animation: light-in .45s ease-out both; }
@keyframes light-in { from { opacity: .15; transform: scale(.83); } to { opacity: 1; transform: none; } }
</style>

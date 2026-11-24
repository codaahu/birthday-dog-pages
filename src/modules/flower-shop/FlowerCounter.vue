<script setup lang="ts">
import { computed } from 'vue'
import { assets, type Dog } from '../../config/assets'
import { personal } from '../../config/personal'

type Mood = 'browse' | 'arrange' | 'wrap' | 'gift'
const props = defineProps<{ mood: Mood; note: string; wrapped: boolean }>()
const emit = defineEmits<{ 'wrap-shown': [] }>()
const cast: ReadonlyArray<{ dog: Dog; name: string }> = [
  { dog: 'maltese', name: personal.maltese },
  { dog: 'golden', name: personal.sender },
]

// 每个动作独立配图，共享角色表用于接入可随正式版发布的素材
const sprites = computed(() => cast.map(({ dog, name }) => {
  const configured = assets.dogs[dog]['flower-' + props.mood]
  const local = import.meta.env.DEV ? '__birthday_dev_flower/' + dog + '-' + props.mood + '.png' : undefined
  const path = configured ?? local
  return { dog, name, src: path ? import.meta.env.BASE_URL + path : undefined }
}))
</script>

<template>
  <div class="counter" :class="['mood-' + mood, { 'wrap-scene': wrapped }]">
    <svg class="shop" viewBox="0 0 420 378" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="flower-wall" x2="0" y2="1">
          <stop stop-color="#fff3de" />
          <stop offset="1" stop-color="#fae5c8" />
        </linearGradient>
        <linearGradient id="flower-window" x2="0" y2="1">
          <stop stop-color="#e4edde" />
          <stop offset="1" stop-color="#fcf3dc" />
        </linearGradient>
        <pattern id="flower-awning" width="84" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 0h42v24Q20 48 0 24Z" fill="#eab9b6" />
          <path d="M42 0h42v24Q62 48 42 24Z" fill="#fff0d7" />
        </pattern>
      </defs>
      <rect width="420" height="378" rx="20" fill="url(#flower-wall)" />
      <path d="M42 280V122a168 89 0 0 1 336 0v158Z" fill="url(#flower-window)" stroke="#a59670" stroke-width="3" />
      <path d="M54 279V124a156 80 0 0 1 312 0v155M54 159h312M210 46v107" fill="none" stroke="#fcf6e4" stroke-width="5" />
      <path d="M54 207q47-39 92-11 70-37 130-30 52 0 90 34v80H54Z" fill="#b9c4a0" opacity=".35" />
      <path d="M61 238q49-37 88-5m125-14q48-23 86 4" fill="none" stroke="#afbd92" stroke-width="2" opacity=".65" />
      <path d="M0 18Q103 5 208 13T420 13v25H0Z" fill="#d5a58e" opacity=".43" />
      <path d="M0 0h420v20H0Z" fill="#ecbcb4" />
      <path d="M0 0h420v40H0Z" fill="url(#flower-awning)" />
      <g fill="none" stroke="#bc9b71" stroke-width="2" stroke-linecap="round">
        <path d="m33 92 4 6 6 4-6 4-4 6-3-6-7-4 7-4 3-6Zm350 65 3 5 6 4-6 3-3 6-4-6-6-3 6-4 4-5Z" />
        <path d="M85 62v9m-4-4h8m250 22v9m-4-4h8" />
      </g>
      <path d="M0 281q117-11 208-9 108 0 212 9v97H0Z" fill="#e6c194" stroke="#bd956f" stroke-width="2" />
      <path d="M0 340q85-11 214-9 127-5 206 4v43H0Z" fill="#d1a67e" opacity=".7" />
      <path d="M9 301q25-8 62-9m278 11 62-8M13 354q32 0 58-4m246 6q32-4 86-2M100 366q84-8 141-4" fill="none" stroke="#a97758" stroke-width="1.6" opacity=".5" />
      <g stroke="#7d8964" stroke-width="2" stroke-linejoin="round">
        <path d="M31 273q5-34 25-68M29 275q-12-36-15-66m17 63q37-22 41-38" fill="none" />
        <path d="M42 233q-18-12-16-21 16 0 20 11m0 0q19-1 25-13c-10-5-18 1-22 6M23 244q-18-8-18-21 13 0 17 13m24 16q1-15 19-15-4 11-13 15" fill="#a9bb90" />
        <path d="M13 258q18 5 44 0l-8 36q-14 8-28-1Z" fill="#d9b58e" stroke="#956f52" />
      </g>
      <g fill="#adc0b0" stroke="#788874" stroke-width="2" stroke-linejoin="round">
        <path d="M382 267q25-15 30-9l5 6q-10 13-31 12m-5-9-18 16-7-7 19-20" />
        <path d="M368 250q15-3 25 5l-2 27q-13 6-25-1Z" />
        <path d="M370 250q9-15 21 2" fill="none" />
      </g>
    </svg>

    <div class="bouquet-place"><slot /></div>

    <TransitionGroup name="cast" tag="div" class="flower-cast">
      <img v-for="sprite in sprites.filter(({ src }) => Boolean(src))" :key="sprite.dog + '-' + mood"
        :class="sprite.dog" :src="sprite.src" :alt="sprite.name" width="320" height="300" draggable="false" />
    </TransitionGroup>
    <p class="dog-line" aria-live="polite">{{ note }}</p>
    <svg v-if="wrapped" class="ribbon-spark" viewBox="0 0 420 378" aria-hidden="true"
      @animationend="emit('wrap-shown')" @animationcancel="emit('wrap-shown')">
      <path d="M115 115v22m-11-11h22m174 14v20m-10-10h20m-150 125v16m-8-8h16m99-211v17m-8-9h16" />
    </svg>
  </div>
</template>

<style scoped>
.counter { position: relative; isolation: isolate; aspect-ratio: 420 / 378; overflow: hidden; border-radius: 1.25rem 1.25rem .9rem .9rem; box-shadow: 0 .26rem .55rem #8e644e35, inset 0 0 0 1px #b99a73; }
.shop, .ribbon-spark { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.bouquet-place { position: absolute; top: .9%; left: 6%; right: 6%; z-index: 1; }
.bouquet-place :deep(svg) { display: block; width: 100%; height: auto; }
.flower-cast { position: absolute; z-index: 2; inset: 0; pointer-events: none; }
.flower-cast img { position: absolute; bottom: 5.5%; width: 42%; height: 43%; object-fit: contain; filter: drop-shadow(0 .17rem 0 #5f443734); }
.flower-cast .maltese { left: -5.3%; }
.flower-cast .golden { right: -5.3%; }
.cast-enter-active, .cast-leave-active { transition: opacity .14s ease, transform .22s ease; }
.cast-enter-from { opacity: 0; transform: translateY(5px) scale(.95); }
.cast-leave-to { opacity: 0; transform: translateY(2px); }
.dog-line { position: absolute; z-index: 3; bottom: 2.14%; left: 8%; right: 8%; width: fit-content; max-width: 84%; margin: 0 auto; padding: .21rem .68rem .28rem; border: 1px solid #ba9474; border-radius: 1rem .9rem .95rem .8rem; text-align: center; color: #684934; background: #fff8e9; font: 700 clamp(.79rem, 3.6vw, 1.06rem)/1.3 'Kaiti SC', STKaiti, KaiTi, '楷体', serif; }
.wrap-scene .bouquet-place { animation: bouquet-wrap .6s cubic-bezier(.25,.75,.37,1) both; }
.ribbon-spark { z-index: 4; fill: none; stroke: #f4b853; stroke-width: 4.2; stroke-linecap: round; animation: sparks .6s ease-out both; }
@keyframes bouquet-wrap { 0% { transform: rotate(-3deg) scale(.89); } 63% { transform: rotate(2deg) scale(1.04); } 100% { transform: none; } }
@keyframes sparks { 0% { opacity: 0; transform: scale(.77); } 40% { opacity: 1; } 100% { opacity: 0; transform: scale(1.15); } }
</style>

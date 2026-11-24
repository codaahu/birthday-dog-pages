<script setup lang="ts">
import { computed, reactive } from 'vue'
import { assets, type Dog } from '../../config/assets'
import { personal } from '../../config/personal'
import DogSticker from '../../shared/DogSticker.vue'
import OpeningEnvelope from './OpeningEnvelope.vue'
import type { DogPose } from './types'

const props = defineProps<{
  preview: boolean
  cover: boolean
  entering: boolean
  unsealing: boolean
  speaker?: Dog
  pose: Record<Dog, DogPose>
  taps: Record<Dog, number>
  heartBurst: number
  busy: boolean
}>()
const emit = defineEmits<{ open: []; pet: [dog: Dog]; heart: [] }>()

// 本地角色图由开发服务读取，可按固定文件名替换
const localArtwork = import.meta.env.DEV ? {
  maltese: '/__birthday_dev_opening/maltese.png',
  golden: '/__birthday_dev_opening/golden.png',
} : undefined
const unavailable = reactive({ maltese: false, golden: false })
const dogs = [{ id: 'maltese', name: personal.maltese }, { id: 'golden', name: personal.sender }] as const
const hasCast = computed(() => dogs.some(({ id }) => assets.dogs[id].happy || (props.preview && localArtwork && !unavailable[id])))

/**
 * 根据分镜选择已有授权动作，缺动作时使用同一角色的常态图
 *
 * @date 2026/11/24 12:22
 * @param dog 角色 ID
 * @return 素材清单中的动作键
 */
function spriteAction(dog: Dog) {
  const action = props.pose[dog] === 'happy' ? (props.speaker === dog ? 'speak' : props.entering ? 'run' : 'happy') : props.pose[dog]
  return assets.dogs[dog][action] ? action : 'happy'
}
</script>

<template>
  <div class="stage" :class="{ entering, conversation: !cover, 'empty-cast': !hasCast }">
    <svg class="scenery" viewBox="0 0 360 400" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="birthday-opening-light">
          <stop offset="0%" stop-color="#f5d99d" stop-opacity=".62" />
          <stop offset="100%" stop-color="#f5d99d" stop-opacity="0" />
        </radialGradient>
        <path id="birthday-opening-spark" d="M0-12q2 10 12 12Q2 2 0 12Q-2 2-12 0Q-2-2 0-12Z" />
        <g id="birthday-opening-paw" fill="currentColor">
          <path d="M-4 3c2-4 6-4 8 0 4 7-10 7-8 0Z" />
          <ellipse cx="-6.5" cy="-1" rx="2" ry="2.8" transform="rotate(-25 -6.5 -1)" />
          <ellipse cx="-2.3" cy="-4.8" rx="1.9" ry="2.7" transform="rotate(-10 -2.3 -4.8)" />
          <ellipse cx="2.4" cy="-4.8" rx="1.9" ry="2.7" transform="rotate(10 2.4 -4.8)" />
          <ellipse cx="6.4" cy="-1" rx="2" ry="2.8" transform="rotate(25 6.4 -1)" />
        </g>
      </defs>
      <ellipse cx="180" cy="160" rx="179" ry="151" fill="url(#birthday-opening-light)" />
      <path d="M28 181C38 103 90 60 156 48c65-11 127 15 152 82 22 58-1 130-50 168-56 42-137 43-184 2C36 267 20 224 28 181Z"
        fill="none" stroke="#d4ac72" stroke-opacity=".32" stroke-width="1.3" stroke-dasharray="2 7" />
      <path d="M43 48c-16 5-26 22-19 34s23 8 25-3-10-18-15-12c-9 12 16 25 39 20"
        fill="none" stroke="#cbab78" stroke-opacity=".69" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="3 6" />
      <g fill="#d4a45f">
        <use href="#birthday-opening-spark" transform="translate(318 120) scale(.73)" />
        <use href="#birthday-opening-spark" transform="translate(38 236) scale(.79)" />
        <use href="#birthday-opening-spark" transform="translate(329 264) scale(1.02)" />
        <use href="#birthday-opening-spark" transform="translate(305 331) scale(.48)" />
        <use href="#birthday-opening-spark" transform="translate(69 329) scale(.48)" />
        <use href="#birthday-opening-spark" transform="translate(111 29) scale(.49)" />
      </g>
      <g fill="#d9a09a" opacity=".75">
        <circle cx="57" cy="129" r="2.3" /><circle cx="311" cy="213" r="2.8" />
        <circle cx="46" cy="282" r="2.4" /><circle cx="282" cy="57" r="2.1" />
      </g>
      <g class="tracks" color="#b48a57">
        <use href="#birthday-opening-paw" transform="translate(35 179) rotate(-30) scale(.88)" />
        <use href="#birthday-opening-paw" transform="translate(52 159) rotate(-28) scale(.73)" />
        <use href="#birthday-opening-paw" transform="translate(40 143) rotate(-21) scale(.67)" />
      </g>
      <path d="M320 182q9-5 13-13m-6 17q8-2 11-4m-12 10q6 1 10 0" fill="none"
        stroke="#d2a673" stroke-width="1.8" stroke-linecap="round" />
    </svg>

    <div v-if="hasCast" class="cast">
      <template v-for="dog in dogs" :key="dog.id">
        <button v-if="assets.dogs[dog.id].happy || (preview && localArtwork && !unavailable[dog.id])" type="button" class="character"
          :class="[dog.id, { speaking: speaker === dog.id, listening: speaker && speaker !== dog.id }]"
          :aria-label="'摸摸' + dog.name" @click="emit('pet', dog.id)">
          <span :key="taps[dog.id]" class="pose" :class="pose[dog.id]">
            <DogSticker v-if="assets.dogs[dog.id].happy" :dog="dog.id" :action="spriteAction(dog.id)" alt="" />
            <img v-else-if="localArtwork" :src="localArtwork[dog.id]" alt="" width="370" height="370"
              decoding="async" @error="unavailable[dog.id] = true" />
          </span>
        </button>
      </template>
      <span v-if="speaker" class="speaker-mark" :class="speaker" aria-hidden="true"><i></i><i></i><i></i></span>
    </div>

    <button v-if="cover" type="button" class="parcel" aria-label="打开生日信封" :disabled="busy"
      @click="emit('open')">
      <OpeningEnvelope :unsealing="unsealing" />
    </button>
    <div v-else class="keepsake" aria-hidden="true"><OpeningEnvelope small :unsealing="false" /></div>

    <button type="button" class="heart" aria-label="点一下爱心" @click="emit('heart')">
      <svg viewBox="0 0 42 42" aria-hidden="true" focusable="false">
        <path d="M21 12q-8-10-15-2c-7 9 4 17 15 25 11-8 22-16 15-25-6-8-13-5-15 2Z"
          fill="#efb8b5" stroke="#9b625b" stroke-width="2.1" stroke-linejoin="round" />
        <path d="M9 13q1-3 5-3" fill="none" stroke="#ffddd3" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
    <svg v-if="heartBurst" :key="heartBurst" class="heart-burst" viewBox="0 0 100 70" aria-hidden="true" focusable="false">
      <path d="M22 32c-8-11-19 1 0 14 19-13 8-25 0-14ZM48 13c-7-10-18 1 0 13 18-12 7-23 0-13ZM75 31c-8-11-19 0 0 13 19-13 8-24 0-13Z"
        fill="#e39a9d" stroke="#a36b63" stroke-width="1.1" />
    </svg>
  </div>
</template>

<style scoped>
.stage { position: relative; isolation: isolate; width: 100%; height: clamp(348px, calc(54vw + 177px), 426px); overflow: hidden; }
.scenery { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.cast { position: absolute; width: 88%; height: 62%; left: 6%; top: 1%; z-index: 1; }
.character { position: absolute; display: block; border: 0; background: transparent; padding: 0; line-height: 0; touch-action: manipulation; color: inherit; }
.character.maltese { width: 55%; left: 1%; top: 2%; }
.character.golden { width: 61%; right: 1%; top: 16%; }
.character .pose { display: block; transform-origin: 50% 78%; }
.character :deep(svg), .character :deep(img) { width: 100%; max-width: none; height: auto; display: block; }
.character :deep(img) { aspect-ratio: 1; object-fit: contain; }
.parcel { display: block; position: absolute; z-index: 2; top: 41%; left: -2%; width: 104%; padding: 0; border: 0; background: transparent; color: inherit; transform-origin: 50% 56%; transition: transform .24s ease; }
.parcel:focus-visible { outline-offset: -26px; border-radius: 2rem; }
.parcel:hover:not(:disabled) { transform: translateY(-4px) rotate(.8deg); }
.parcel:active:not(:disabled) { transform: translateY(2px) scale(.98); }
.parcel:disabled { opacity: 1; }
.heart { position: absolute; top: 8%; right: 8%; width: 44px; height: 44px; display: grid; place-items: center; border: 0; padding: 6px; background: transparent; transform: rotate(12deg); z-index: 3; }
.heart svg { display: block; width: 100%; }
.heart:hover { transform: rotate(5deg) scale(1.12); }
.heart-burst { position: absolute; width: 95px; top: 4%; right: 1%; z-index: 4; pointer-events: none; animation: hearts .68s ease-out both; }
.keepsake { position: absolute; width: 36%; top: 62%; left: 2%; z-index: 2; pointer-events: none; opacity: .86; transform: rotate(9deg); }
.tracks { opacity: .62; }
.entering .tracks { animation: track-in .75s .05s ease-out both; }
.entering .character.golden { animation: golden-trot 1.28s .16s cubic-bezier(.24,.72,.29,1) both; }
.entering .character.maltese { animation: peek 1.12s .65s cubic-bezier(.22,.76,.25,1) both; }
.entering .parcel { animation: parcel-in 1.32s .16s cubic-bezier(.24,.72,.29,1) both; }
.entering .heart { animation: heartbeat .52s 1.45s ease-out both; }
.wag { animation: shake .42s ease; }
.lie { transform: translateY(7px) scale(1.02,.88) rotate(-3deg); transition: transform .26s ease; }
.sleep { transform: translateY(9px) scale(.97,.88); transition: transform .26s ease; }
.conversation { height: clamp(238px, 66vw, 299px); }
.conversation .cast { width: 86%; top: -1%; left: 7%; height: 81%; }
.conversation .scenery { transform: scale(1.04,1.15); }
.conversation .heart { top: 4%; right: 7%; }
.speaking { z-index: 1; filter: drop-shadow(0 4px 7px #e1a75d45); animation: speak .52s ease-out 2; }
.listening { opacity: .85; }
.speaker-mark { position: absolute; top: 18%; right: 7%; color: #ad7647; display: flex; gap: 3px; transform: rotate(21deg); }
.speaker-mark.maltese { top: 11%; right: auto; left: 11%; transform: rotate(-24deg); color: #ad7b73; }
.speaker-mark i { display: block; width: 2px; height: 9px; background: currentColor; border-radius: 4px; }
.speaker-mark i:first-child, .speaker-mark i:last-child { transform: translateY(3px); height: 5px; }
.empty-cast.stage:not(.conversation) { height: 270px; }
.empty-cast .parcel { top: 13%; }
.empty-cast.conversation { height: 186px; }
.empty-cast .keepsake { width: 61%; top: -8%; left: 18%; }
@keyframes golden-trot {
  0% { opacity: 0; transform: translate(54px, 16px) rotate(7deg); }
  37% { opacity: 1; transform: translate(25px, -8px) rotate(-5deg); }
  63% { transform: translate(7px, 4px) rotate(3deg); }
  83% { transform: translateY(-3px) rotate(-1deg); }
  100% { opacity: 1; transform: none; }
}
@keyframes peek {
  0% { opacity: 0; transform: translate(-21px, 41px) scale(.88); }
  60% { opacity: 1; transform: translate(-4px, -5px) rotate(-4deg); }
  100% { opacity: 1; transform: none; }
}
@keyframes parcel-in {
  0% { opacity: 0; transform: translate(43px, -32px) rotate(7deg) scale(.88); }
  43% { opacity: 1; transform: translate(19px, -15px) rotate(-3deg) scale(.96); }
  80% { transform: translate(1px, 5px) rotate(1deg); }
  100% { opacity: 1; transform: none; }
}
@keyframes track-in { from { opacity: 0; } to { opacity: .62; } }
@keyframes heartbeat { from { opacity: 0; transform: rotate(12deg) scale(.65); } to { opacity: 1; transform: rotate(12deg) scale(1); } }
@keyframes hearts { from { opacity: 1; transform: translateY(4px) scale(.68); } to { opacity: 0; transform: translateY(-38px) scale(1.25); } }
@keyframes shake { 25% { transform: rotate(-8deg) translateY(-3px); } 62% { transform: rotate(6deg); } }
@keyframes speak { 38% { transform: translateY(-8px) rotate(-2deg); } 100% { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .entering .tracks, .entering .character, .entering .parcel, .entering .heart, .speaking, .wag, .heart-burst { animation: none !important; }
  .heart-burst { display: none; }
}
</style>

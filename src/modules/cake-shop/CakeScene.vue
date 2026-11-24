<script setup lang="ts">
import { computed } from 'vue'
import { assets, type Dog } from '../../config/assets'
import { personal } from '../../config/personal'
import type { CakePhase } from './types'

const props = defineProps<{ phase: CakePhase; celebrating: boolean }>()
const cast: ReadonlyArray<{ dog: Dog; name: string }> = [
  { dog: 'maltese', name: personal.maltese },
  { dog: 'golden', name: personal.sender },
]
const moodByPhase: Record<CakePhase, string> = {
  editing: 'make', served: 'ready', candles: 'ready', wish: 'wish', finished: 'cheer',
}
const mood = computed(() => moodByPhase[props.phase])

// 舞台上的四组动作由同一对角色出演，每张图可独立替换
const sprites = computed(() => cast.map(({ dog, name }) => {
  const supplied = assets.dogs[dog]['cake-' + mood.value]
  const local = import.meta.env.DEV ? '__birthday_dev_cake/' + dog + '-' + mood.value + '.png' : undefined
  const path = supplied ?? local
  return { dog, name, src: path ? import.meta.env.BASE_URL + path : undefined }
}))
</script>

<template>
  <div class="cake-scene" :class="['cake-' + mood, { celebrating }]">
    <svg class="bakery" viewBox="0 0 420 350" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="cake-bakery-wall" x2="0" y2="1">
          <stop stop-color="#fbebdf" />
          <stop offset="1" stop-color="#fff5e6" />
        </linearGradient>
        <linearGradient id="cake-bakery-window" x2="0" y2="1">
          <stop stop-color="#dfeadf" />
          <stop offset="1" stop-color="#f9efdc" />
        </linearGradient>
        <pattern id="cake-bakery-cloth" width="34" height="24" patternUnits="userSpaceOnUse">
          <rect width="34" height="24" fill="#edc1ba" />
          <path d="M0 0h17v24H0ZM0 0h34v12H0Z" fill="#f8ddd1" opacity=".64" />
          <path d="M17 12h17v12H17Z" fill="#fff0df" opacity=".25" />
        </pattern>
      </defs>

      <rect width="420" height="350" rx="19" fill="url(#cake-bakery-wall)" />
      <path d="M110 170v-61c0-44 40-77 100-77s100 33 100 77v61Z" fill="url(#cake-bakery-window)" stroke="#bca58d" stroke-width="3" />
      <path d="M120 169v-56c0-36 35-70 90-70s90 34 90 70v56M210 44v118m-89-49h177" stroke="#fff3e1" stroke-width="4" fill="none" />
      <path d="M122 142q49-22 88 10 29-31 89-20v38H122Z" fill="#bacdad" opacity=".55" />
      <path d="M14 91q76-3 154-48m83 0q73 42 156 42" fill="none" stroke="#bc9989" stroke-width="1.8" stroke-linecap="round" />
      <g stroke="#ba827d" stroke-width="1.4" stroke-linejoin="round">
        <path d="m29 90 20-3-5 18Zm46-9 20-6-3 20Zm43-15 17-8 0 19Zm164-7 18 8-17 12Zm43 17 21 5-15 15Zm48 9 19 1-10 17Z" fill="#e9a6ab" />
        <path d="m53 85 20-4-4 18Zm43-11 20-7-3 18Zm203-5 21 6-15 15Zm50 13 20 3-12 16Z" fill="#f4d394" stroke="#c6a376" />
      </g>
      <path d="M0 192q113-6 210-4 123-2 210 4v98H0Z" fill="#e2c0a0" stroke="#b58e73" stroke-width="2" />
      <path d="M0 249q97-7 210-7 123 0 210 5v103H0Z" fill="url(#cake-bakery-cloth)" stroke="#b8847e" stroke-width="2" />
      <path d="M0 254q105-6 210-6t210 5" fill="none" stroke="#fff0df" stroke-width="2" opacity=".76" />

      <g stroke="#9b7b61" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M25 213c3-20 14-24 33-22q16 2 18 22Z" fill="#e8c98e" />
        <path d="m30 211 5-13m8 14 4-15m8 16 3-16m8 15 2-12" fill="none" opacity=".47" />
        <ellipse cx="50" cy="216" rx="32" ry="5" fill="#f7e2cd" />
        <path d="M358 213Q342 194 349 180q10-16 33-11 17 5 18 17-2 18-17 30Z" fill="#fbf1dc" />
        <path d="M396 181q21-5 18 9-3 9-19 9" fill="none" />
        <path d="M352 182q15 8 45-2m-38 24q10 7 25 2" fill="none" opacity=".66" />
        <path d="M363 165q-7-9 2-15m10 13q-4-8 4-13" fill="none" opacity=".53" />
      </g>
      <g fill="none" stroke="#ce9b63" stroke-width="2" stroke-linecap="round">
        <path d="M71 139v11m-5-6h11m282-29v13m-6-7h11M91 107v6m-3-3h6m235 34v8m-4-4h8" />
      </g>
    </svg>

    <div class="nightwash" aria-hidden="true"></div>
    <div class="candlelight" aria-hidden="true"></div>
    <div class="cake-plate"><slot /></div>

    <TransitionGroup name="bake-cast" tag="div" class="cast">
      <img v-for="sprite in sprites.filter(({ src }) => Boolean(src))" :key="sprite.dog + '-' + mood"
        :class="sprite.dog" :src="sprite.src" :alt="sprite.name" width="320" height="300" draggable="false" />
    </TransitionGroup>

    <svg v-if="phase === 'finished'" class="party-sparks" viewBox="0 0 420 350" aria-hidden="true">
      <path d="M100 116v25m-12-12h24m195 12v23m-11-12h22m-13-68 3 9 8 2-8 3-3 8-3-8-8-3 8-2 3-9ZM70 186l-8 5m286-7 9 5" />
    </svg>
    <div v-if="celebrating" class="confetti" aria-hidden="true">
      <span class="smoke"></span>
      <i v-for="piece in 12" :key="piece" :style="{ '--piece': piece }"></i>
    </div>
  </div>
</template>

<style scoped>
.cake-scene { position: relative; isolation: isolate; aspect-ratio: 420 / 350; overflow: hidden; border-radius: 1.25rem 1.2rem .9rem .9rem; box-shadow: 0 .22rem .58rem #9d6b6150; transition: box-shadow .45s; }
.bakery, .party-sparks, .nightwash, .candlelight, .confetti { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.nightwash { z-index: 1; opacity: 0; background: #332d3f; transition: opacity .55s ease; }
.candlelight { z-index: 2; opacity: 0; background: radial-gradient(ellipse at 50% 41%, #ffe39a85, #f7bb6556 22%, #e8a45b20 40%, transparent 63%); transition: opacity .65s ease; }
.cake-wish { box-shadow: none; }
.cake-wish .nightwash { opacity: .93; }
.cake-wish .candlelight { opacity: 1; }
.cake-plate { position: absolute; z-index: 3; top: -12%; inset-inline: -3%; }
.cake-plate :deep(svg) { display: block; width: 100%; height: auto; }
.cake-wish .cake-plate { filter: drop-shadow(0 0 1.5rem #eab46948); }
.cast { position: absolute; z-index: 4; inset: 0; pointer-events: none; }
.cast img { position: absolute; bottom: -2%; width: 43%; height: 44%; object-fit: contain; filter: drop-shadow(0 .14rem 0 #5c443f40); }
.cast .maltese { left: -7%; }
.cast .golden { right: -7%; }
.cake-wish .cast img { opacity: .9; filter: brightness(.78) saturate(.79) drop-shadow(0 0 .12rem #f9dd9d80); }
.bake-cast-enter-active, .bake-cast-leave-active { transition: opacity .16s ease, transform .25s ease; }
.bake-cast-enter-from, .bake-cast-leave-to { opacity: 0 !important; transform: translateY(.36rem); }
.celebrating .cast img { animation: cake-cheer .58s ease-out both; }
@keyframes cake-cheer { 30% { transform: translateY(-.55rem) rotate(-4deg); } 70% { transform: translateY(.08rem) rotate(2deg); } }
.party-sparks { z-index: 3; fill: none; stroke: #d79f58; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.confetti { z-index: 5; }
.confetti i { position: absolute; top: 15%; left: calc(var(--piece) * 7% + 4%); width: .38rem; height: .62rem; border-radius: .12rem; background: #edbd67; animation: fall .98s ease-out both; animation-delay: calc(var(--piece) * 13ms); }
.confetti i:nth-of-type(2n) { background: #da8d9d; }
.confetti i:nth-of-type(3n) { background: #a0b58d; }
.smoke { position: absolute; top: 27%; left: 47%; width: 6%; height: 8%; border: .14rem solid #9c8b99; border-radius: 48%; animation: rise .74s ease-out both; }
@keyframes fall { from { opacity: 1; transform: translateY(0) rotate(0); } to { opacity: 0; transform: translateY(9rem) rotate(105deg); } }
@keyframes rise { from { opacity: .65; transform: scale(.45); } to { opacity: 0; transform: translateY(-2.4rem) scale(1.24); } }
</style>

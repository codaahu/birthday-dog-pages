<script setup lang="ts">
import { computed } from 'vue'
import { assets, type Dog } from '../../config/assets'
import { personal } from '../../config/personal'
import type { ShopMood } from './types'

const props = defineProps<{ mood: ShopMood; showcase?: boolean }>()
const pairName = personal.maltese + '和' + personal.sender
const choices: Record<ShopMood, readonly { dog: Dog; slot: Dog | 'pair'; alt: string }[]> = {
  idle: [
    { dog: 'maltese', slot: 'maltese', alt: personal.maltese },
    { dog: 'golden', slot: 'golden', alt: personal.sender },
  ],
  spin: [{ dog: 'golden', slot: 'pair', alt: pairName }],
  open: [{ dog: 'maltese', slot: 'pair', alt: pairName }],
  ssr: [{ dog: 'golden', slot: 'pair', alt: pairName }],
}
const sprites = computed(() => choices[props.mood].map((item) => {
  const key = 'gacha-' + props.mood + (item.slot === 'pair' ? '-pair' : '')
  const path = assets.dogs[item.dog][key]
    ?? (import.meta.env.DEV ? '__birthday_dev_gacha/' + item.slot + '-' + props.mood + '.png' : undefined)
  return { ...item, src: path ? import.meta.env.BASE_URL + path : undefined }
}))
</script>

<template>
  <Transition name="gacha-cast" mode="out-in">
    <div :key="mood" class="gacha-cast" :class="['mood-' + mood, { showcase }]">
      <img v-for="sprite in sprites.filter(({ src }) => Boolean(src))" :key="sprite.slot"
        :class="sprite.slot" :src="sprite.src" :alt="sprite.alt" width="320" height="300" />
    </div>
  </Transition>
</template>

<style scoped>
.gacha-cast { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.gacha-cast img { position: absolute; object-fit: contain; filter: drop-shadow(0 .12rem 0 #604a4145); }
.gacha-cast .maltese, .gacha-cast .golden { width: 40%; height: 35%; bottom: -7%; }
.gacha-cast .maltese { left: -6.5%; }
.gacha-cast .golden { right: -6.5%; }
.gacha-cast .pair { width: 44%; height: 38%; left: -7%; bottom: -7%; }
.gacha-cast.showcase { inset: auto 0 0; height: 5.2rem; }
.gacha-cast.showcase .pair { width: 50%; height: 158%; left: 25%; bottom: -27%; transform: rotate(-6deg); }
.gacha-cast.showcase.mood-ssr .pair { animation: celebrate .55s ease-out both; }
.gacha-cast-enter-active, .gacha-cast-leave-active { transition: opacity .16s ease; }
.gacha-cast-enter-from, .gacha-cast-leave-to { opacity: 0; }
@keyframes celebrate { 35% { transform: translateY(-.55rem) rotate(-8deg); } }
</style>

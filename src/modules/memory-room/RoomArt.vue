<script setup lang="ts">
import { ref } from 'vue'
import { assets } from '../../config/assets'
import { foodHotspots, hotspots, type HotspotId } from './room'

const emit = defineEmits<{ explore: [id: HotspotId] }>()
const image = assets.room ? import.meta.env.BASE_URL + assets.room : undefined
const previousTap = ref<{ id: HotspotId; count: number }>()

/**
 * 让点中的物件短暂发光，并把交互交给房间模块
 *
 * @date 2026/11/24 13:54
 * @param id 被点击的物件 ID
 */
function touch(id: HotspotId) {
  previousTap.value = { id, count: (previousTap.value?.count ?? 0) + 1 }
  emit('explore', id)
}
</script>

<template>
  <div class="art">
    <img :src="image" alt="暖灯下的礼物小屋" width="1312" height="1199" />
    <button v-for="spot in hotspots" :key="spot.id" class="spot" type="button"
      :class="{ edible: foodHotspots.some(({ id }) => id === spot.id) }"
      :style="{ left: spot.x + '%', top: spot.y + '%', width: spot.w + '%', height: spot.h + '%' }"
      :aria-label="spot.label" :data-hotspot="spot.id" @click="touch(spot.id)">
      <span v-if="previousTap?.id === spot.id" :key="previousTap.count" class="flash" aria-hidden="true"></span>
    </button>
  </div>
</template>

<style scoped>
.art { position: relative; width: 100%; isolation: isolate; }
img { display: block; width: 100%; height: auto; mask-image: radial-gradient(ellipse 66% 70% at 50% 50%, #000 86%, transparent 100%); }
.spot { position: absolute; display: grid; place-items: center; min-height: 0; padding: 0; border: 0; color: inherit; background: transparent; border-radius: 30%; -webkit-tap-highlight-color: transparent; }
.edible { z-index: 1; }
.spot::after, .flash { content: ''; position: absolute; width: min(102%, 5rem); height: min(104%, 5rem); border-radius: 50%; background: radial-gradient(ellipse, #fff3bb68, transparent 70%); opacity: 0; pointer-events: none; transition: opacity .18s ease; }
@media (hover: hover) { .spot:hover::after { opacity: .6; } }
.spot:focus-visible { outline: 2px solid #a6713b; outline-offset: 0; }
.spot:active::after { opacity: 1; }
.flash { animation: touched .58s ease-out both; }
@keyframes touched { 0% { opacity: .95; transform: scale(.7); } 45% { opacity: .78; transform: scale(1.14); } 100% { opacity: 0; transform: scale(1.27); } }
@media (prefers-reduced-motion: reduce) { .flash { animation: none; } }
</style>

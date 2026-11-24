<script setup lang="ts">
import { computed, ref } from 'vue'
import { useArtworkDrag, type ArtworkPoint } from '../../shared/studio/useArtworkDrag'
import { flowerMaterials, papers, ribbons } from './config'
import FlowerBloom from './FlowerBloom.vue'
import { stemPosition } from './bouquet'
import type { Bouquet, Stem } from './types'

const props = defineProps<{ bouquet: Bouquet; selected?: string; editing: boolean; packaged: boolean }>()
const emit = defineEmits<{ select: [id: string]; move: [id: string, point: ArtworkPoint] }>()
const artwork = ref<SVGSVGElement>()
const drag = useArtworkDrag(() => artwork.value, (id, point) => emit('move', id, stemPosition(point)))
const paper = computed(() => papers[props.bouquet.paper])
const ribbon = computed(() => ribbons[props.bouquet.ribbon])
const card = computed(() => Array.from(props.bouquet.message.trim().replace(/\s+/g, ' ')))
defineExpose({ artwork })

/** 返回正在拖动的坐标或草稿中的原位置
 * @date 2026/11/24 11:47
 * @param stem 当前绘制的花枝
 * @return 花冠显示坐标
 */
function position(stem: Stem) {
  return drag.active.value?.id === stem.id ? stemPosition(drag.active.value.point) : stem
}

/** 点选花枝，并开始跟踪位移
 * @date 2026/11/24 11:47
 * @param event 图层收到的指针事件
 * @param stem 被选中的花枝
 */
function start(event: PointerEvent, stem: Stem) {
  if (props.editing) {
    emit('select', stem.id)
    drag.start(event, stem.id, stem)
  }
}
</script>

<template>
  <svg ref="artwork" class="artwork" viewBox="0 0 360 340" role="img"
    :aria-label="packaged ? '已包装的生日花束' : '花束实时预览'"
    @pointermove="drag.move" @pointerup="drag.end" @pointercancel="drag.end" @lostpointercapture="drag.end">
    <template v-if="bouquet.stems.length">
      <ellipse cx="183" cy="309" rx="83" ry="9" fill="#a97c5a" opacity=".29" />
      <path d="M180 278 86 154Q112 139 136 163L170 172 207 155Q237 148 269 160L194 302Z"
        :fill="paper.shade" stroke="#403a34" stroke-width="2" stroke-linejoin="round" />
      <g v-for="stem in bouquet.stems" :key="'stem-' + stem.id" fill="none" stroke="#64836b" stroke-linecap="round">
        <path :d="'M180 267 Q' + ((position(stem).x + 180) / 2) + ' 185 ' + position(stem).x + ' ' + position(stem).y" stroke-width="3.4" />
        <path :d="'M' + ((position(stem).x * 2 + 180) / 3) + ' ' + (position(stem).y + 42) + 'q-16-16-24-9q7 18 24 9'" fill="#a7bf99" stroke-width="1.4" />
      </g>
      <g v-for="stem in bouquet.stems" :key="stem.id" :transform="'translate(' + position(stem).x + ' ' + position(stem).y + ')'"
        :class="{ 'editor-piece': editing }" @pointerdown="start($event, stem)">
        <circle v-if="editing && selected === stem.id" data-editor="" r="28" fill="none" stroke="#a46e72" stroke-dasharray="3 4" stroke-width="1.4" />
        <circle r="26" fill="transparent" />
        <FlowerBloom :kind="stem.kind" :color="flowerMaterials[stem.kind].colors[stem.color]" />
      </g>
      <path d="M99 179Q129 199 172 202Q210 192 262 174L220 263 196 304Q175 317 149 300L130 244Z"
        :fill="paper.color" stroke="#403a34" stroke-width="2" stroke-linejoin="round" pointer-events="none" />
      <path d="M100 181 182 252 151 299M260 177 195 239 219 265" fill="none" stroke="#403a34" stroke-width="1.5" opacity=".48" pointer-events="none" />
      <g :fill="ribbon.color" stroke="#403a34" stroke-width="2" stroke-linejoin="round" pointer-events="none">
        <path d="M180 255q-35-27-42-7q-7 15 37 12m8-5q30-28 43-13q12 16-38 19m-9-3-22 27 13-4 3 10 13-28m1-5 18 29 3-11 12 4-26-24" />
        <ellipse cx="184" cy="256" rx="8" ry="6" />
      </g>
      <g v-if="card.length" transform="translate(212 218) rotate(7)" pointer-events="none">
        <rect width="108" height="58" rx="7" fill="#fffdf8" stroke="#403a34" stroke-width="1.5" />
        <text x="54" y="19" text-anchor="middle" font-family="Microsoft YaHei, sans-serif" font-size="8" fill="#403a34">
          <tspan x="54">{{ card.slice(0, 14).join('') }}</tspan>
          <tspan x="54" dy="13">{{ card.slice(14, 28).join('') }}</tspan>
          <tspan x="54" dy="13">{{ card.slice(28, 42).join('') }}</tspan>
        </text>
      </g>
    </template>
    <g v-else stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="180" cy="309" rx="70" ry="9" fill="#a97c5a" opacity=".29" />
      <path d="M139 214q10-7 10-20v-15h61v15q0 11 11 20 9 9 8 24l-6 53q-2 13-19 15h-47q-18-2-20-15l-6-53q-1-15 8-24Z" fill="#d2e0ce" stroke="#879279" stroke-width="2.4" />
      <path d="M137 244q41-8 89 0l-5 45q-2 9-15 10h-51q-13-1-15-10Z" fill="#a4c3b2" opacity=".59" />
      <ellipse cx="180" cy="179" rx="32" ry="5.5" fill="#ecf1df" stroke="#879279" stroke-width="2.1" />
      <path d="M148 231q-4 22 2 44m11-59q-4 27 1 70m43-55q4 21-2 52" fill="none" stroke="#fff9ea" stroke-width="3" opacity=".85" />
      <path d="M147 255q33-10 66 0m-22-2 13-9m-13 9 16 5" fill="none" stroke="#ae865d" stroke-width="2.5" />
      <path d="M164 211h32l5 35-20 11-18-11Z" fill="#fff5dd" stroke="#ac8d68" stroke-width="1.5" transform="rotate(-9 180 234)" />
      <path d="M178 238q-11-6-6-10 4-3 6 2 2-5 7-1 4 4-7 9Z" fill="#e4a6a9" stroke="#aa6d70" stroke-width="1.5" />
    </g>
  </svg>
</template>

<style scoped>
.editor-piece { touch-action: none; cursor: grab; }
.editor-piece:active { cursor: grabbing; }
</style>

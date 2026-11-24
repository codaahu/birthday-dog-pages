<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { assets, type Dog } from '../../config/assets'
import { field, giftKinds } from './config'
import CatchProp from './CatchProp.vue'
import type { Round } from './game'

const props = defineProps<{
  round: Round
  mood: 'idle' | 'play' | 'warn' | 'result'
  active: boolean
  ready: boolean
  record: boolean
}>()
const emit = defineEmits<{ move: [position: number]; key: [direction: 'left' | 'right', held: boolean]; release: [] }>()
const artwork = ref<SVGSVGElement>()
let activePointer: number | undefined

// 两个角色分别使用游乐场动作图，正式素材由共享角色表配置
const sprites = computed(() => {
  const images: Partial<Record<Dog, string>> = {}
  for (const dog of ['maltese', 'golden'] as const) {
    const configured = assets.dogs[dog]['catch-' + props.mood]
    const local = import.meta.env.DEV ? '__birthday_dev_catch/' + dog + '-' + props.mood + '.png' : undefined
    const path = configured ?? local
    if (path) {
      images[dog] = import.meta.env.BASE_URL + path
    }
  }
  return images
})
const hit = computed(() => {
  const latest = props.round.hit
  return latest && props.round.elapsed - latest.at < 730 ? latest : undefined
})

watch(() => props.active, (active) => {
  if (!active) {
    activePointer = undefined
  }
})
defineExpose({ focusField })

/**
 * 把键盘焦点放到已开始的场地
 *
 * @date 2026/11/24 16:02
 */
function focusField() {
  artwork.value?.focus({ preventScroll: true })
}

/**
 * 识别场地内开始的拖动，为屏幕边缘系统手势保留空间
 *
 * @date 2026/11/24 16:02
 * @param event 按下的指针
 */
function start(event: PointerEvent) {
  if (!props.active || activePointer !== undefined || event.button !== 0
    || event.clientX < 16 || event.clientX > document.documentElement.clientWidth - 16) {
    return
  }
  activePointer = event.pointerId
  artwork.value?.setPointerCapture(event.pointerId)
  move(event)
}

/**
 * 将当前触点换算成固定比例场地内的横坐标
 *
 * @date 2026/11/24 16:02
 * @param event 移动中的指针
 */
function move(event: PointerEvent) {
  if (event.pointerId !== activePointer || !artwork.value) {
    return
  }
  const rect = artwork.value.getBoundingClientRect()
  emit('move', (event.clientX - rect.left) * field.width / rect.width)
}

/**
 * 松手或取消后结束本次拖动
 *
 * @date 2026/11/24 16:02
 * @param event 结束的指针
 */
function release(event: PointerEvent) {
  if (event.pointerId === activePointer) {
    activePointer = undefined
  }
}

/**
 * 把左右方向键的按下和松开交给时间驱动的游戏循环
 *
 * @date 2026/11/24 16:02
 * @param event 场地收到的按键事件
 */
function key(event: KeyboardEvent) {
  if (props.active && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    event.preventDefault()
    emit('key', event.key === 'ArrowLeft' ? 'left' : 'right', event.type === 'keydown')
  }
}
</script>

<template>
  <div class="playfield" :class="{ 'running-field': active }">
    <svg ref="artwork" :viewBox="'0 0 ' + field.width + ' ' + field.height"
      role="img" aria-label="手绘游乐场，拖动篮子或用方向键接礼物"
      :tabindex="active ? 0 : -1" @pointerdown="start" @pointermove="move" @pointerup="release"
      @pointercancel="release" @lostpointercapture="release" @keydown="key" @keyup="key" @blur="emit('release')">
      <defs>
        <linearGradient id="catch-sky" x2="0" y2="1">
          <stop stop-color="#dbeaf4" />
          <stop offset="1" stop-color="#f2f1dc" />
        </linearGradient>
        <linearGradient id="catch-grass" x2="0" y2="1">
          <stop stop-color="#d4dfb9" />
          <stop offset="1" stop-color="#b7c99d" />
        </linearGradient>
        <pattern id="catch-weave" width="14" height="10" patternUnits="userSpaceOnUse">
          <rect width="14" height="10" fill="#d3aa7c" />
          <path d="M0 .5h14M4 0v5m5 0v5" fill="none" stroke="#a47b59" stroke-width="1" opacity=".67" />
          <path d="M0 5h14" stroke="#f1cd9d" opacity=".58" />
        </pattern>
      </defs>

      <rect width="360" height="384" fill="url(#catch-sky)" />
      <g fill="#fff7e6" opacity=".8">
        <path d="M-4 90q14-29 39-19 9-22 32-12 18-2 28 16 14-3 19 15Zm261 18q8-16 27-13 9-22 29-11 18-7 33 10 10-2 17 14Z" />
        <path d="M119 61q7-13 18-12 12-19 27-9 16 0 22 12 9 0 13 9Z" />
      </g>
      <g fill="none" stroke="#b7a07c" stroke-width="1.7" stroke-linecap="round">
        <path d="M-2 26q85 48 184-7m-2 0q103 50 182-1" />
        <path d="M31 130v14m-7-7h14m271 24v12m-6-6h12M214 72v10m-5-5h10m53 162v12m-6-6h12" stroke="#d8b478" opacity=".88" />
      </g>
      <g stroke="#a78568" stroke-width="1" stroke-linejoin="round">
        <path d="m21 36 17 5-12 12Zm34 8 20 2-11 13Zm36 2 20-2-8 15Zm32-4 19-4-8 16Zm83-11 16 5-12 11Zm35 8 20 3-13 12Zm36 3 20-1-9 15Zm39-4 19-5-6 15Z" fill="#f5d68e" />
        <path d="m39 43 16 2-9 13Zm40 4h12l-7 14Zm35-3 12-3-4 14Zm113-8 15 4-11 13Zm37 6h14l-7 13Zm37-1 13-2-4 13Z" fill="#eba9af" />
      </g>
      <path d="M0 300q62-39 126-20 70 27 139 6 53-16 95-28v126H0Z" fill="#c8dab9" />
      <path d="M0 328q77-23 132-6 59 14 141-14 37-13 87-11v87H0Z" fill="url(#catch-grass)" />
      <path d="M0 367q42-15 95-12 103 13 182-5 38-9 83-6v40H0Z" fill="#f4dfaf" opacity=".83" />
      <g fill="none" stroke="#80966d" stroke-width="1.7" stroke-linecap="round">
        <path d="m15 331 4 8m8-1 4-8m273-9 4 6m7-3 4-9m28 20 4-6M110 342l4 4m5-3 3-5" />
      </g>

      <g v-if="ready" opacity=".68" aria-hidden="true">
        <g transform="translate(61 135) rotate(-13)"><CatchProp kind="gift" /></g>
        <g transform="translate(300 106) rotate(11)"><CatchProp kind="letter" /></g>
        <g transform="translate(283 247) rotate(10)"><CatchProp kind="berry" /></g>
        <g transform="translate(75 266) rotate(-8)"><CatchProp kind="flower" /></g>
      </g>

      <g v-for="prop in round.visible" :key="prop.id" class="falling-gift" :data-kind="prop.kind"
        :transform="'translate(' + prop.x + ' ' + prop.y + ') rotate(' + (prop.id % 3 - 1) * 10 + ')'">
        <CatchProp :kind="prop.kind" />
      </g>

      <image v-if="sprites.maltese" :href="sprites.maltese" x="-3" y="267" width="108" height="101" />
      <g :transform="'translate(' + round.basket + ' 0)'">
        <ellipse cy="366" rx="42" ry="5.5" fill="#a58157" opacity=".33" />
        <image v-if="sprites.golden" :href="sprites.golden" x="-65" y="233" width="130" height="124" />
        <path d="M-31 318q5-28 31-28t31 28" fill="none" stroke="#a87d56" stroke-width="4" stroke-linecap="round" />
        <path d="M-34 321h68l-8 33q-2 8-10 9h-32q-8-1-10-9Z" fill="url(#catch-weave)" stroke="#926947" stroke-width="2.2" />
        <rect x="-36" y="315" width="72" height="11" rx="5.5" fill="#ebc491" stroke="#926947" stroke-width="2" />
        <path d="M-15 334q-5-9-12-6 2 6 11 9m2-3q7-8 13-5-3 6-11 8m-2-4-5 10m5-10 6 9" fill="#e4a0a2" stroke="#a76d72" stroke-width="1.5" stroke-linecap="round" />
      </g>

      <text v-if="hit && (active || mood === 'warn')" :x="hit.gift.x" :y="field.catchY - 53 - (round.elapsed - hit.at) / 25"
        class="score-pop" :class="{ minus: giftKinds[hit.gift.kind].points < 0 }" text-anchor="middle" paint-order="stroke"
        :opacity="1 - (round.elapsed - hit.at) / 730">
        {{ giftKinds[hit.gift.kind].points > 0 ? '+' : '' }}{{ giftKinds[hit.gift.kind].points }}
      </text>

      <g v-if="record" class="record-stars" fill="#f4c572" stroke="#a57852" stroke-width="1.5">
        <path d="m48 104 4 10 11 2-9 7 2 11-9-6-9 6 2-11-8-7 11-2Zm261 24 4 10 11 2-9 7 2 11-9-6-9 6 2-11-8-7 11-2Zm-34-53 3 7 8 1-6 5 1 8-6-4-7 4 2-8-6-5 7-1Z" />
      </g>
    </svg>
    <div v-if="$slots.overlay" class="field-overlay"><slot name="overlay" /></div>
  </div>
</template>

<style scoped>
.playfield { position: relative; isolation: isolate; overflow: hidden; border: 1px solid #b7c7b0; border-radius: 1.13rem 1.27rem .86rem .94rem; box-shadow: 0 .23rem .55rem #637d6a36; background: #dceaf1; }
.playfield > svg { display: block; width: 100%; height: auto; }
.running-field > svg { touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: ew-resize; }
.running-field > svg:focus-visible { outline-offset: -4px; }
.field-overlay { position: absolute; inset: 0; display: grid; place-items: center; padding: .65rem; pointer-events: none; }
.field-overlay > :deep(*) { pointer-events: auto; }
.score-pop { fill: #527b56; stroke: #fff8e6; stroke-width: 3.8; stroke-linejoin: round; font: 800 23px system-ui, sans-serif; pointer-events: none; }
.score-pop.minus { fill: #b6606c; }
.record-stars { transform-origin: center; animation: record-pop .6s ease-out both; }
@keyframes record-pop { from { opacity: 0; transform: scale(.75); } to { opacity: 1; transform: none; } }
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useArtworkDrag, type ArtworkPoint } from '../../shared/studio/useArtworkDrag'
import { cakePosition } from './cake'
import CakePiece from './CakePiece.vue'
import { creams, spongeKinds } from './config'
import type { Cake, CakePhase, Piece } from './types'

const props = defineProps<{ cake: Cake; phase: CakePhase; selected?: string; editing: boolean; dogArtwork?: string }>()
const emit = defineEmits<{ select: [id: string]; move: [id: string, point: ArtworkPoint] }>()
const artwork = ref<SVGSVGElement>()
const drag = useArtworkDrag(() => artwork.value, (id, point) => emit('move', id, cakePosition(point)))
const cream = computed(() => creams[props.cake.cream])
const sponge = computed(() => spongeKinds[props.cake.sponge])
const candleVisible = computed(() => ['candles', 'wish', 'finished'].includes(props.phase))
const candleLocations = computed(() => {
  const candle = props.cake.candle
  if (candle.kind === 'number') {
    const middle = (candle.digits.length - 1) / 2
    return Array.from(candle.digits, (digit, index) => ({ x: 180 + (index - middle) * 28, digit }))
  }
  return [{ x: 155, digit: '' }, { x: 180, digit: '' }, { x: 205, digit: '' }]
})
defineExpose({ artwork })

/** 获取正在拖动的装饰坐标
 * @date 2026/11/24 11:51
 * @param piece 当前绘制的装饰
 * @return 画布中应使用的位置
 */
function position(piece: Piece) {
  return drag.active.value?.id === piece.id ? cakePosition(drag.active.value.point) : piece
}

/** 选中装饰并按需开始拖动
 * @date 2026/11/24 11:51
 * @param event 画布指针事件
 * @param piece 被操作的装饰
 */
function start(event: PointerEvent, piece: Piece) {
  if (props.editing) {
    emit('select', piece.id)
    drag.start(event, piece.id, piece)
  }
}
</script>

<template>
  <svg ref="artwork" class="artwork" viewBox="0 0 360 315" role="img" aria-label="生日蛋糕实时预览"
    @pointermove="drag.move" @pointerup="drag.end" @pointercancel="drag.end" @lostpointercapture="drag.end">
    <ellipse cx="180" cy="277" rx="131" ry="15" fill="#836177" opacity=".29" />
    <path d="M54 254q0 28 126 28t126-28v-6H54Z" fill="#d8b5c6" stroke="#403a34" stroke-width="2" />
    <ellipse cx="180" cy="248" rx="126" ry="30" fill="#f1d6e1" stroke="#403a34" stroke-width="2" />
    <path d="M76 180v62c0 19 47 34 104 34s104-15 104-34v-62Z" :fill="sponge.color" stroke="#403a34" stroke-width="2" />
    <g :stroke="sponge.stripe" stroke-width="4.5" fill="none" stroke-linecap="round">
      <path d="M83 222q95 40 194 0M83 238q95 42 194 0" />
      <path v-if="cake.sponge === 'crepe'" d="M84 230q95 41 192 1M98 254q82 31 164 0" stroke-width="2" />
    </g>
    <path d="M76 182v13c4 9 17 9 24 16c7 21 17 27 22 11c9-11 22 5 39 10c12 17 25 12 30 2c6-8 18-8 27-5c11 9 24 5 29-7c4-12 17-1 26-12l11-15v-13Z"
      :fill="cream.shadow" stroke="#403a34" stroke-width="2" stroke-linejoin="round" />
    <ellipse cx="180" cy="181" rx="104" ry="42" :fill="cream.color" stroke="#403a34" stroke-width="2" />
    <path d="M105 173q29-23 75-21m75 20q-13-11-31-15" fill="none" :stroke="cream.shadow" stroke-width="2" stroke-linecap="round" opacity=".58" />

    <g v-for="piece in cake.pieces" :key="piece.id" :class="{ 'editor-piece': editing }"
      :transform="'translate(' + position(piece).x + ' ' + position(piece).y + ') rotate(' + piece.angle + ') scale(' + piece.scale / 100 + ')'"
      @pointerdown="start($event, piece)">
      <circle v-if="editing && selected === piece.id" data-editor="" cy="-4" r="21" fill="none" stroke="#a46e72" stroke-dasharray="3 3" />
      <circle cy="-4" r="20" fill="transparent" />
      <CakePiece :kind="piece.kind" :dog-artwork="dogArtwork" />
    </g>

    <g v-if="candleVisible" stroke="#403a34" stroke-width="1.45" stroke-linecap="round" pointer-events="none">
      <g v-for="(item, index) in candleLocations" :key="index" :transform="'translate(' + item.x + ' 154)'">
        <path d="M0 3v19" />
        <rect v-if="item.digit" x="-10" y="-22" width="20" height="27" rx="6" fill="#f5d69b" />
        <text v-if="item.digit" x="0" y="-3" text-anchor="middle" font-size="17" font-family="sans-serif" font-weight="bold" stroke="none" fill="#403a34">{{ item.digit }}</text>
        <path v-else d="M-4-20h8v28h-8Z" :fill="index === 1 ? '#b9bddd' : '#e4a1b0'" />
        <path v-if="!item.digit" d="M-3-13l6-4m-6 12 6-4m-6 12 6-4" stroke="#fff6e7" />
        <path d="M0-24v4" />
        <g v-if="phase === 'wish'" class="flame" stroke="none">
          <path d="M0-24c-11-3-6-15 0-21c-1 8 12 16 0 21Z" fill="#ffd17b" />
          <path d="M0-25c-5-2-3-6 0-10c0 4 5 7 0 10Z" fill="#fff3bc" />
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.editor-piece { touch-action: none; cursor: grab; }
.editor-piece:active { cursor: grabbing; }
.flame { transform-box: fill-box; transform-origin: center bottom; animation: candle-flicker 1.22s ease-in-out infinite alternate; }
.flame:nth-child(odd) { animation-delay: -.56s; }
@keyframes candle-flicker { 0% { transform: rotate(-8deg) scale(.92,1.04); } 100% { transform: rotate(8deg) scale(1.02,.9); } }
</style>

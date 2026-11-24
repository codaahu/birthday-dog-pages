<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { initialZoom, transformPhoto, type Point } from './albumGestures'

defineProps<{ src: string; label: string; width: number; height: number }>()
const emit = defineEmits<{ close: [] }>()
const closeButton = ref<HTMLButtonElement>()
const viewport = ref<HTMLElement>()
const image = ref<HTMLImageElement>()
const view = ref(initialZoom)

// 只跟踪位于查看区内的两根手指
const points = new Map<number, Point>()
let observer: ResizeObserver | undefined

onMounted(() => {
  closeButton.value?.focus({ preventScroll: true })
  if (viewport.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => updateView({ x: 0, y: 0 }, { x: 0, y: 0 }, 1))
    observer.observe(viewport.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())

/**
 * 更新图片位移和倍率，视口变化时重新限位
 *
 * @date 2026/11/24 14:45
 * @param from 手势原中心，相对全屏区域中心
 * @param to 手势新中心，相对全屏区域中心
 * @param ratio 本次缩放倍率相对于上一状态的比例
 */
function updateView(from: Point, to: Point, ratio: number) {
  if (!viewport.value || !image.value) {
    return
  }
  view.value = transformPhoto(view.value, from, to, ratio, {
    width: viewport.value.clientWidth, height: viewport.value.clientHeight,
  }, { width: image.value.clientWidth, height: image.value.clientHeight })
}

/**
 * 捕获进入照片查看区的单指或双指
 *
 * @date 2026/11/24 14:45
 * @param event 按下的指针事件
 */
function start(event: PointerEvent) {
  if (event.button !== 0 || points.size >= 2) {
    return
  }
  viewport.value?.setPointerCapture(event.pointerId)
  points.set(event.pointerId, { x: event.clientX, y: event.clientY })
}

/**
 * 双指按中心和距离缩放，单指在大图上拖动
 *
 * @date 2026/11/24 14:45
 * @param event 当前移动的指针
 */
function move(event: PointerEvent) {
  const previous = points.get(event.pointerId)
  if (!previous || !viewport.value) {
    return
  }
  const next = { x: event.clientX, y: event.clientY }
  const second = [...points.entries()].find(([id]) => id !== event.pointerId)?.[1]
  points.set(event.pointerId, next)

  if (!second) {
    updateView({ x: 0, y: 0 }, { x: next.x - previous.x, y: next.y - previous.y }, 1)
    return
  }

  const rect = viewport.value.getBoundingClientRect()
  const from = { x: (previous.x + second.x - rect.width) / 2 - rect.left, y: (previous.y + second.y - rect.height) / 2 - rect.top }
  const to = { x: (next.x + second.x - rect.width) / 2 - rect.left, y: (next.y + second.y - rect.height) / 2 - rect.top }
  const oldDistance = Math.hypot(previous.x - second.x, previous.y - second.y)
  const distance = Math.hypot(next.x - second.x, next.y - second.y)
  if (oldDistance > 2) {
    updateView(from, to, distance / oldDistance)
  }
}

/**
 * 释放结束或被浏览器接管的指针
 *
 * @date 2026/11/24 14:45
 * @param event 已结束的指针事件
 */
function end(event: PointerEvent) {
  points.delete(event.pointerId)
}

/**
 * 在查看层内处理键盘缩放，避免触发相册翻页
 *
 * @date 2026/11/24 14:45
 * @param event 键盘事件
 */
function zoomWithKey(event: KeyboardEvent) {
  if (event.key === '+' || event.key === '-' || event.key === '=') {
    event.preventDefault()
    updateView({ x: 0, y: 0 }, { x: 0, y: 0 }, event.key === '-' ? 1 / 1.25 : 1.25)
  }
}
</script>

<template>
  <div class="fullscreen" aria-label="全屏照片" role="region"
    @keydown.esc.stop.prevent="emit('close')" @keydown.stop="zoomWithKey">
    <div ref="viewport" class="zoom-viewport"
      @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end">
      <img ref="image" :src="src" :alt="label" :width="width" :height="height" draggable="false"
        :style="{ transform: 'translate3d(' + view.x + 'px,' + view.y + 'px,0) scale(' + view.scale + ')' }" />
    </div>
    <button ref="closeButton" type="button" class="zoom-close" aria-label="关闭全屏" @click="emit('close')">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
    </button>
    <p class="zoom-hint">双指缩放 · 拖动查看</p>
  </div>
</template>

<style scoped>
.fullscreen { position: fixed; inset: 0; z-index: 8; background: #251b17f7; overflow: hidden; }
.zoom-viewport {
  position: absolute; inset: env(safe-area-inset-top) max(.6rem, env(safe-area-inset-right))
    env(safe-area-inset-bottom) max(.6rem, env(safe-area-inset-left));
  display: flex; align-items: center; justify-content: center; overflow: hidden; touch-action: none; cursor: grab;
}
.zoom-viewport:active { cursor: grabbing; }
.zoom-viewport img { display: block; width: auto; height: auto; max-width: 100%; max-height: 100%; object-fit: contain; flex: 0 1 auto; user-select: none; -webkit-user-select: none; -webkit-user-drag: none; }
.zoom-close { position: absolute; top: max(.8rem, env(safe-area-inset-top)); right: max(.8rem, env(safe-area-inset-right)); width: 44px; border: 1px solid #ffead46e; border-radius: 50%; display: grid; place-items: center; color: #fffbf4; padding: 0; background: #33241ee0; }
.zoom-close svg { width: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; }
.zoom-hint { position: absolute; inset-inline: .65rem; bottom: max(.85rem, env(safe-area-inset-bottom)); text-align: center; margin: 0; color: #fff6e2; font-size: .78rem; text-shadow: 0 1px 3px #1c140e; pointer-events: none; }
</style>

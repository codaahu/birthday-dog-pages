<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Photo } from '../../config/photos'
import { puzzleHelpAfterMs, type PuzzleState } from './puzzle'

const props = defineProps<{ puzzle?: PuzzleState; photo?: Photo; elapsed: number; busy: boolean }>()
const emit = defineEmits<{ swap: [first: number, second: number]; finish: [status: 'completed' | 'skipped'] }>()
const selected = ref<number>()
const showOriginal = ref(false)
const photoUnavailable = ref(false)
const imageSrc = computed(() => {
  const path = props.photo?.image
  return path?.startsWith('data:') ? path : path ? import.meta.env.BASE_URL + path : ''
})

/**
 * 选中一块拼图或提交两个位置的交换
 *
 * @date 2026/11/24 11:23
 * @param index 被点击的棋盘位置
 */
function pick(index: number) {
  if (selected.value === undefined) {
    selected.value = index
    return
  }
  if (selected.value !== index) {
    emit('swap', selected.value, index)
  }
  selected.value = undefined
}
</script>

<template>
  <section class="puzzle">
    <h2>合照拼图</h2>
    <template v-if="puzzle?.status">
      <p role="status">{{ puzzle.status === 'completed' ? '拼好啦！完整照片已经收进收藏。' : '这次先跳过拼图。' }}</p>
      <img v-if="puzzle.status === 'completed' && imageSrc" class="finished-photo" :src="imageSrc" alt="拼好的照片" />
    </template>
    <template v-else>
      <p v-if="!imageSrc || photoUnavailable">暂时没有可用的拼图照片，可以直接跳过。</p>
      <template v-else-if="puzzle">
        <p>点选两块拼图来交换位置。</p>
        <div v-if="showOriginal" class="original"><img :src="imageSrc" alt="原图预览" @error="photoUnavailable = true" /></div>
        <div v-else class="board" aria-label="九宫格拼图">
          <button v-for="(tile, index) in puzzle.tiles" :key="index" type="button" class="tile"
            :disabled="busy" :aria-label="'拼图位置 ' + (index + 1)" :aria-pressed="selected === index" @click="pick(index)">
            <img :src="imageSrc" alt="" draggable="false" @error="photoUnavailable = true"
              :style="{ left: '-' + (tile % 3) * 100 + '%', top: '-' + Math.floor(tile / 3) * 100 + '%' }" />
          </button>
        </div>
        <p class="stats">{{ Math.floor(elapsed / 1000) }} 秒 · 交换 {{ puzzle.moves }} 次</p>
        <p v-if="elapsed >= puzzleHelpAfterMs" class="hint">可以先看看原图，从明显的角落开始拼。</p>
      </template>
      <div class="tools">
        <button v-if="imageSrc && !photoUnavailable && puzzle" type="button" class="secondary" @click="showOriginal = !showOriginal">
          {{ showOriginal ? '返回拼图' : '预览原图' }}
        </button>
        <button type="button" class="secondary" :disabled="busy" @click="emit('finish', 'skipped')">跳过拼图</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
h2 { margin: .1rem 0 .55rem; }
p { margin: .35rem 0; }
.board, .original, .finished-photo { width: min(100%, 25rem); margin: .75rem auto; }
.board { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: .19rem; }
.tile { appearance: none; padding: 0; position: relative; aspect-ratio: 1; overflow: hidden; border: 1px solid var(--ink); border-radius: .2rem; background: var(--white); }
.tile[aria-pressed="true"] { outline: 3px solid #a75366; outline-offset: -4px; z-index: 1; }
.tile img { position: absolute; width: 300%; height: 300%; max-width: none; object-fit: cover; pointer-events: none; }
.original img, .finished-photo { display: block; max-height: 50dvh; object-fit: contain; }
.original img { width: 100%; }
.stats, .hint { font-size: .875rem; }
.tools { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .7rem; }
</style>

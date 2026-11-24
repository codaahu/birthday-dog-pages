<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { assets } from '../../config/assets'
import type { Photo } from '../../config/photos'
import AlbumFullscreen from './AlbumFullscreen.vue'
import { swipeDirection } from './albumGestures'
import { albumTitles, type AlbumCategory } from './room'

const props = defineProps<{ category: AlbumCategory; photos: Photo[]; index: number }>()
const emit = defineEmits<{ change: [index: number] }>()
const photo = computed(() => props.photos[props.index])
const flipped = ref(false)
const enlarged = ref(false)
const available = ref(true)
const offset = ref(0)
const slide = ref<'forward' | 'backward'>('forward')
const photoButton = ref<HTMLButtonElement>()
const base = import.meta.env.BASE_URL
const title = computed(() => albumTitles[props.category])
const src = computed(() => photo.value?.image.startsWith('data:') ? photo.value.image : base + photo.value?.image)
const hasNote = computed(() => Boolean(photo.value?.note?.trim()))
const canPage = computed(() => props.photos.length > 1)
const sticker = computed(() => {
  const dog = props.category === 'funny' || props.category === 'daily' ? 'golden' : 'maltese'
  const path = assets.dogs[dog].happy
  if (path) {
    return base + path
  }
  return import.meta.env.DEV ? base + '__birthday_dev_opening/' + dog + '.png' : undefined
})
const stickerAvailable = ref(true)

// 跟踪一次翻页手势的起点和主方向，按下新手势后重置误点拦截
let touch: { id: number; x: number; y: number; axis?: 'x' | 'y' } | undefined
let skipClick = false

watch([() => props.category, () => photo.value?.id], () => {
  flipped.value = false
  enlarged.value = false
  available.value = true
  offset.value = 0
  touch = undefined
})
watch(sticker, () => { stickerAvailable.value = true })

/**
 * 切到相邻照片，记录动画方向并交给原有相册存档流程
 *
 * @date 2026/11/24 14:46
 * @param direction 翻阅方向，-1 为上一张，1 为下一张
 */
function page(direction: number) {
  const index = props.index + direction
  if (index < 0 || index >= props.photos.length || enlarged.value) {
    return
  }
  slide.value = direction < 0 ? 'backward' : 'forward'
  emit('change', index)
}

/**
 * 识别从场景内部开始的滑动，预留两侧系统手势区
 *
 * @date 2026/11/24 14:46
 * @param event 按下的指针事件
 */
function startSwipe(event: PointerEvent) {
  if (!event.isPrimary) {
    cancelSwipe()
    return
  }
  skipClick = false
  if (event.button !== 0 || event.clientX < 20 || event.clientX > document.documentElement.clientWidth - 20) {
    return
  }
  touch = { id: event.pointerId, x: event.clientX, y: event.clientY }
}

/**
 * 横向拖动时让照片随手移动，纵向手势交给浏览器
 *
 * @date 2026/11/24 14:46
 * @param event 移动中的指针事件
 */
function moveSwipe(event: PointerEvent) {
  if (touch?.id !== event.pointerId) {
    return
  }
  const dx = event.clientX - touch.x
  const dy = event.clientY - touch.y
  if (!touch.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
    touch.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y'
    skipClick = true
    if (touch.axis === 'x') {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    }
  }
  if (touch.axis === 'x' && canPage.value) {
    const atEdge = (dx > 0 && props.index === 0) || (dx < 0 && props.index === props.photos.length - 1)
    offset.value = Math.max(-145, Math.min(145, dx * (atEdge ? .2 : .68)))
  }
}

/**
 * 释放完成的滑动，只有符合阈值的水平手势才翻页
 *
 * @date 2026/11/24 14:46
 * @param event 释放指针的位置
 */
function finishSwipe(event: PointerEvent) {
  if (touch?.id !== event.pointerId) {
    return
  }
  const delta = { x: event.clientX - touch.x, y: event.clientY - touch.y }
  const direction = touch.axis === 'y' ? 0 : swipeDirection(delta)
  touch = undefined
  offset.value = 0
  if (direction) {
    skipClick = true
    page(direction)
  }
}

/**
 * 取消手势并防止随后产生的误点
 *
 * @date 2026/11/24 14:46
 */
function cancelSwipe() {
  touch = undefined
  offset.value = 0
  skipClick = true
}

/**
 * 阻断滑动结束后浏览器合成的点击，保留键盘操作
 *
 * @date 2026/11/24 14:46
 * @param event 照片区域收到的点击
 */
function filterClick(event: MouseEvent) {
  if (skipClick && event.detail > 0) {
    event.stopPropagation()
    event.preventDefault()
  }
  skipClick = false
}

/**
 * 关闭全屏查看并把焦点交还原来的拍立得
 *
 * @date 2026/11/24 14:46
 */
async function closeFullscreen() {
  enlarged.value = false
  await nextTick()
  photoButton.value?.focus({ preventScroll: true })
}
</script>

<template>
  <section class="album" :class="'album-' + category"
    @keydown.left.prevent="page(-1)" @keydown.right.prevent="page(1)">
    <div class="journal" :inert="enlarged || undefined">
      <header class="journal-head">
        <h2 id="memory-album-title">{{ title }}</h2>
        <slot name="close" />
      </header>
      <slot name="status" />

      <div v-if="photo" class="album-stage"
        @pointerdown="startSwipe" @pointermove="moveSwipe" @pointerup="finishSwipe"
        @pointercancel="cancelSwipe" @click.capture="filterClick">
        <Transition :name="slide">
          <div :key="photo.id" class="album-page">
            <div class="paper-stack" :class="{ dragging: offset !== 0 }"
              :style="{ '--ratio': photo.width / photo.height, '--slide': offset + 'px' }">
              <div class="unfold">
                <figure class="print">
                  <span class="tape" aria-hidden="true"></span>
                  <div class="photo-space">
                    <div class="photo-flip" :class="{ flipped }">
                      <div class="photo-face front" :inert="flipped || undefined">
                        <button v-if="available" ref="photoButton" class="view-photo" type="button"
                          aria-label="全屏查看照片" :tabindex="flipped ? -1 : 0" @click="enlarged = true">
                          <img :src="src" :alt="photo.title || title" :width="photo.width" :height="photo.height"
                            draggable="false" @error="available = false" />
                        </button>
                        <p v-else class="photo-error">这张照片暂时无法显示。</p>
                      </div>
                      <div v-if="hasNote" class="photo-face back" :inert="!flipped || undefined" :aria-hidden="!flipped">
                        <div class="note-paper">
                          <p>{{ photo.note }}</p>
                          <div v-if="photo.date || photo.location" class="metadata">
                            <span v-if="photo.date">{{ photo.date }}</span>
                            <span v-if="photo.location">{{ photo.location }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <figcaption class="print-caption">
                    <button v-if="hasNote" class="note-tab" type="button" aria-label="翻面"
                      :aria-pressed="flipped" @click="flipped = !flipped">
                      <span v-if="photo.title">{{ photo.title }}</span>
                      <span class="note-mark">{{ flipped ? '照片' : '留言' }}</span>
                    </button>
                    <template v-else>
                      <span v-if="photo.title" class="photo-title">{{ photo.title }}</span>
                      <div v-if="photo.date || photo.location" class="metadata">
                        <span v-if="photo.date">{{ photo.date }}</span>
                        <span v-if="photo.location">{{ photo.location }}</span>
                      </div>
                    </template>
                  </figcaption>
                  <img v-if="sticker && stickerAvailable" class="dog-sticker" :src="sticker" alt="" draggable="false"
                    @error="stickerAvailable = false" />
                  <svg class="album-stamp" viewBox="0 0 48 48" aria-hidden="true">
                    <template v-if="category === 'couple'">
                      <path d="M24 38C16 32 5 25 6 17c1-9 13-11 18-2 6-9 17-6 18 2 1 8-10 16-18 21Z" /><path d="m13 18 2-3m24 19 4 1M8 34l-3 1" />
                    </template>
                    <template v-else-if="category === 'portrait'">
                      <path d="M6 11h36v27H6zM10 15h28v17H10zM19 34h10m-12-8 6-7 5 6 4-3 5 5" />
                    </template>
                    <template v-else-if="category === 'travel'">
                      <path d="M5 13h38v7c-5 0-5 8 0 8v7H5v-7c5 0 5-8 0-8Zm26 4v3m0 4v3m0 4v1M13 27l12-6m-9-1 4 3 0 6" />
                    </template>
                    <template v-else-if="category === 'daily'">
                      <path d="M10 8h28v25l-8 7H10zM30 40v-8h8M16 17h16m-16 6h14m-14 6h9" />
                    </template>
                    <template v-else-if="category === 'engagement'">
                      <path d="M24 21a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 0-4-5 4-4h8l4 4-4 5M9 9c-4-5 0-8 4-5l5 4-5 3c-4 2-6 1-4-2Zm30 0c4-5 0-8-4-5l-5 4 5 3c4 2 6 1 4-2Z" />
                    </template>
                    <template v-else-if="category === 'funny'">
                      <path d="M5 16h14l3-5h20v27H5zM12 24h23m-23 5h14M29 18l5 4 5-4" />
                    </template>
                    <template v-else>
                      <path d="M15 30c-3 5 1 9 5 7l12-10c3 3 9 0 7-4-1-2-2-3-4-3 1-3 0-5-2-6-4-2-8 1-6 5l-12 8c-3-2-7 0-7 3 0 3 4 5 7 2ZM9 12l2 3m5-8 1 4m5-4-1 4" />
                    </template>
                  </svg>
                </figure>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <p v-else class="empty">相册暂时空着。</p>

      <footer class="journal-foot">
        <nav v-if="canPage" class="pagination" aria-label="相册分页">
          <button type="button" aria-label="上一张" :disabled="index === 0" @click="page(-1)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
          </button>
          <span class="page-count" aria-live="polite">
            {{ index + 1 }} / {{ photos.length }}
            <span class="page-line" :style="{ '--progress': (index + 1) / photos.length }" aria-hidden="true"></span>
          </span>
          <button type="button" aria-label="下一张" :disabled="index === photos.length - 1" @click="page(1)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </nav>
        <p v-if="hasNote" class="flip-hint">{{ flipped ? '轻触下方相纸回到正面' : '轻触相纸上的留言翻面' }}</p>
        <slot />
      </footer>
    </div>

    <AlbumFullscreen v-if="photo && enlarged" :src="src" :label="photo.title || title"
      :width="photo.width" :height="photo.height" @close="closeFullscreen" />
  </section>
</template>

<style scoped>
.album {
  --paper: #fffaf0;
  --ink: #593c2d;
  --theme: #f2d2cd;
  --theme-light: #fff1e9;
  --mark: #ae695e;
  --tape: #eab5ab;
  --hand: 'Kaiti SC', STKaiti, KaiTi, '楷体', serif;
  --photo-limit: min(61vh, 35rem);
  --photo-limit: min(61dvh, 35rem);
  min-height: 100%;
  color: var(--ink);
}
.album-portrait { --theme: #dbe3dd; --theme-light: #f4f6ed; --mark: #617b70; --tape: #a9bfb4; }
.album-travel { --theme: #cddfe1; --theme-light: #eaf4f3; --mark: #577e87; --tape: #a2bec7; }
.album-daily { --theme: #f5d9b1; --theme-light: #fff0d8; --mark: #986a3f; --tape: #edbc7b; }
.album-engagement { --theme: #efdbac; --theme-light: #fff5d9; --mark: #9a7033; --tape: #d9b573; }
.album-funny { --theme: #e5d9eb; --theme-light: #f9effc; --mark: #805e91; --tape: #c2a6d1; }
.album-pet { --theme: #e7dfb8; --theme-light: #f8f1d3; --mark: #817541; --tape: #c7ba7a; }

.journal {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  padding: max(.85rem, env(safe-area-inset-top)) max(.5rem, env(safe-area-inset-right))
    max(.9rem, env(safe-area-inset-bottom)) max(.5rem, env(safe-area-inset-left));
}
.journal-head { grid-row: 1; position: relative; display: grid; place-items: center; min-height: 48px; }
.journal-head h2 {
  margin: 0 44px;
  border-radius: 52% 48% 47% 53% / 25% 33% 67% 75%;
  background: #fff6e9ed;
  box-shadow: 0 .13rem .45rem #39201238;
  padding: .42rem 1.18rem .5rem;
  text-align: center;
  font: 750 clamp(1.2rem, 5vw, 1.76rem)/1.2 var(--hand);
  color: var(--ink);
}
.album-stage, .empty { grid-row: 3; }
.album-stage { position: relative; display: grid; align-items: center; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
.album-page { display: grid; place-items: center; padding: 1.15rem .65rem .95rem; }
.paper-stack { position: relative; isolation: isolate; width: min(100%, max(63%, calc(var(--photo-limit) * var(--ratio) + 1.13rem))); transform: translate3d(var(--slide), 0, 0); transition: transform .23s ease; }
.paper-stack.dragging { transition: none; }
.paper-stack::before, .paper-stack::after {
  position: absolute; z-index: -1; inset: 2%; content: ''; border-radius: .45rem .3rem .55rem .4rem;
  box-shadow: 0 .13rem .4rem #351e1b35; background: var(--theme);
  animation: stack-open .48s cubic-bezier(.24,.7,.35,1) both;
}
.paper-stack::before { --tilt: -4deg; background: var(--theme-light); }
.paper-stack::after { --tilt: 3.5deg; }
@keyframes stack-open { from { transform: translateY(11px) rotate(0deg); } to { transform: rotate(var(--tilt)); } }
.unfold { animation: unfold .42s cubic-bezier(.24,.78,.35,1) both; }
@keyframes unfold { from { opacity: 0; transform: translateY(24px) rotate(-2deg) scale(.95); } }
.print {
  position: relative; margin: 0; padding: .55rem .55rem 0;
  background: var(--paper); border-radius: .42rem .38rem .53rem .36rem;
  box-shadow: 0 .4rem 1.4rem #3d251e68, inset 0 0 0 1px #dfc8b38a;
}
.tape {
  position: absolute; z-index: 3; top: -.53rem; left: 18%; width: 4.8rem; height: 1.05rem; transform: rotate(-8deg);
  background: repeating-linear-gradient(105deg, #fff8 0 2px, transparent 2px 6px), var(--tape);
  clip-path: polygon(0 0, 99% 0, 96% 35%, 100% 62%, 96% 100%, 0 97%, 4% 67%, 1% 52%, 4% 19%);
  opacity: .88; pointer-events: none;
}
.photo-space { width: 100%; aspect-ratio: var(--ratio); min-height: 5.6rem; max-height: var(--photo-limit); perspective: 1100px; }
.photo-flip { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform .45s cubic-bezier(.3,.65,.35,1); }
.photo-flip.flipped { transform: rotateY(180deg); }
.photo-face { position: absolute; inset: 0; display: grid; place-items: center; backface-visibility: hidden; -webkit-backface-visibility: hidden; background: var(--theme-light); border-radius: .18rem; }
.photo-face.back { transform: rotateY(180deg); background: repeating-linear-gradient(transparent 0 1.7rem, #b78b7133 1.7rem calc(1.7rem + 1px)), var(--theme-light); }
.view-photo { width: 100%; height: 100%; min-height: 0; padding: 0; border: 0; background: transparent; overflow: hidden; }
.view-photo img { display: block; width: 100%; height: 100%; object-fit: contain; user-select: none; -webkit-user-select: none; -webkit-user-drag: none; }
.photo-error { margin: .8rem; text-align: center; }
.note-paper { width: 100%; max-height: 100%; overflow: auto; padding: .8rem 1.1rem; text-align: center; overscroll-behavior: contain; }
.note-paper p { margin: 0; font: 700 clamp(1rem, 4.4vw, 1.34rem)/1.5 var(--hand); white-space: pre-wrap; overflow-wrap: anywhere; user-select: text; }
.metadata { display: flex; flex-wrap: wrap; gap: .25rem .75rem; justify-content: center; margin-top: .2rem; color: #6e5645; font-size: .68rem; }

.print-caption { position: relative; text-align: center; display: grid; align-content: center; min-height: 3.4rem; padding: .18rem clamp(1.7rem, 10%, 2.65rem); font: 700 clamp(.82rem, 3.6vw, 1.08rem)/1.25 var(--hand); overflow-wrap: anywhere; }
.note-tab { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: .2rem .45rem; width: 100%; min-height: 44px; padding: .1rem; border: 0; background: transparent; color: inherit; font: inherit; }
.note-mark { padding: .16rem .42rem; border-radius: 31% 19% 25% 23%; background: var(--theme); color: var(--ink); font-size: .72rem; }
.dog-sticker { position: absolute; z-index: 2; left: -.21rem; bottom: -.23rem; width: min(17%, 3.35rem); height: auto; transform: rotate(-12deg); filter: drop-shadow(1px 2px 1px #431d233a); pointer-events: none; }
.album-stamp { position: absolute; bottom: .19rem; right: -.26rem; width: min(16%, 3.2rem); height: auto; padding: .18rem; transform: rotate(12deg); border: 1px dashed currentColor; border-radius: 28%; color: var(--mark); background: var(--theme-light); pointer-events: none; }
.album-stamp path { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

.journal-foot { grid-row: 4; display: grid; justify-items: center; padding-bottom: .17rem; }
.pagination { display: flex; align-items: center; justify-content: center; gap: .55rem; max-width: 100%; }
.pagination button { width: 44px; padding: .5rem; display: grid; place-items: center; border: 1px solid #ebd2b8; border-radius: 50%; color: var(--ink); background: #fff7eaea; }
.pagination button:disabled { cursor: default; opacity: .48; }
.pagination svg { width: 19px; stroke: currentColor; stroke-width: 1.8; fill: none; stroke-linejoin: round; stroke-linecap: round; }
.page-count { display: grid; gap: .23rem; place-items: center; min-width: 3.65rem; padding: .21rem .56rem .37rem; border-radius: .9rem; background: #fff8edf2; font-size: .72rem; font-weight: 760; font-variant-numeric: tabular-nums; }
.page-line { width: 100%; height: 3px; border-radius: 99px; background: var(--theme); }
.page-line::before { content: ''; display: block; width: 100%; height: 100%; border-radius: inherit; background: var(--mark); transform: scaleX(var(--progress)); transform-origin: left; transition: transform .2s ease; }
.flip-hint, .empty { text-align: center; background: #fff8eded; }
.flip-hint { margin: .32rem 0 0; border-radius: 1rem; padding: .16rem .55rem; font: 700 .82rem/1.5 var(--hand); }
.empty { align-self: center; justify-self: center; padding: .85rem 1.45rem; border-radius: .35rem; box-shadow: .24rem .3rem var(--theme); transform: rotate(-2deg); }
.forward-enter-active, .forward-leave-active, .backward-enter-active, .backward-leave-active { transition: transform .27s ease, opacity .2s ease; }
.forward-leave-active, .backward-leave-active { position: absolute; inset: 0; pointer-events: none; }
.forward-enter-from, .backward-leave-to { transform: translate3d(18%,0,0); opacity: 0; }
.backward-enter-from, .forward-leave-to { transform: translate3d(-18%,0,0); opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .forward-enter-active, .forward-leave-active, .backward-enter-active, .backward-leave-active, .photo-flip { transition: none; }
  .unfold, .paper-stack::before, .paper-stack::after { animation: none; }
}
</style>

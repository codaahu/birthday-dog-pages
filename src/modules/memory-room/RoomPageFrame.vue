<script setup lang="ts">
import { assets, type Dog } from '../../config/assets'
import { dialogue } from '../../config/dialogue'
import type { RoomControls } from './types'

defineProps<{ controls?: RoomControls; found: number; total: number }>()

const copy = dialogue.memoryRoom
const base = import.meta.env.BASE_URL

/**
 * 读取正式角色素材，本地开发时复用独立角色预览图
 *
 * @date 2026/11/24 14:22
 * @param dog 角色 ID
 * @return 角色图片地址，未配置时为空
 */
function dogImage(dog: Dog) {
  const path = assets.dogs[dog].happy
  if (path) {
    return base + path
  }
  return import.meta.env.DEV ? base + '__birthday_dev_opening/' + dog + '.png' : undefined
}

// 对白两侧沿用共享角色图层
const greeters = (['maltese', 'golden'] as const).map((dog) => ({ dog, image: dogImage(dog) }))
</script>

<template>
  <div class="room-page">
    <header class="chapter-head">
      <div class="chapter-bar">
        <button v-if="controls?.exit" class="round-button back" type="button" aria-label="返回" @click="controls.exit()">
          <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M24 16H8m7-7-7 7 7 7" /></svg>
        </button>
        <p class="chapter-label">CHAPTER 01 <span>·</span> 回忆小屋</p>
        <button v-if="controls" class="round-button music" type="button" aria-label="背景音乐"
          :aria-pressed="controls.music" @click="controls.toggleMusic()">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M12 23V9l13-3v14m-13-8 13-3M12 23c0 4-6 5-6 2 0-2 3-4 6-2Zm13-3c0 4-6 5-6 2 0-2 3-4 6-2Z" />
            <path v-if="!controls.music" class="muted-slash" d="M6 6l21 22" />
          </svg>
        </button>
      </div>
      <ul v-if="controls?.chapters" class="chapter-progress" aria-label="冒险进度">
        <li v-for="(done, index) in controls.chapters" :key="index" :class="{ done }">
          <span class="mini-paw" aria-hidden="true"></span>
          <span class="sr-only">{{ done ? '已走过一站' : '待探索一站' }}</span>
        </li>
      </ul>

      <div class="title-art">
        <svg class="title-flourish" viewBox="0 0 390 67" preserveAspectRatio="none" aria-hidden="true">
          <path class="spark" d="M22 13q2 7 7 8-5 2-7 8-1-6-6-7 5-2 6-9ZM365 38q1 5 5 7-4 1-5 5-1-4-5-5 4-1 5-7ZM16 38l1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" />
          <path class="title-heart" d="M351 28c-9-8-7-17-3-16 3 1 3 5 4 6s5-7 9-4c4 4-6 11-10 14Z" />
          <path class="swoosh" d="M151 59q49-14 33-3c-19 13 40-12 95-4" />
        </svg>
        <h1>{{ copy.title }}</h1>
      </div>
    </header>

    <slot />

    <div class="room-caption">
      <p class="hint"><span aria-hidden="true">♡</span>{{ copy.hint }}<span aria-hidden="true">♡</span></p>
      <p class="discovery" aria-live="polite">
        <svg viewBox="0 0 28 25" aria-hidden="true">
          <path d="M14 11c-4 0-8 5-8 8 0 3 4 4 8 4s8-1 8-4c0-3-4-8-8-8Z" />
          <ellipse cx="5" cy="10" rx="2.8" ry="3.8" transform="rotate(-28 5 10)" />
          <ellipse cx="11" cy="5" rx="2.8" ry="3.8" transform="rotate(-12 11 5)" />
          <ellipse cx="17" cy="5" rx="2.8" ry="3.8" transform="rotate(12 17 5)" />
          <ellipse cx="23" cy="10" rx="2.8" ry="3.8" transform="rotate(28 23 10)" />
        </svg>
        已发现回忆 <strong>{{ found }} <span>/ {{ total }}</span></strong>
      </p>
      <div v-if="$slots.actions" class="room-actions"><slot name="actions" /></div>
    </div>

    <div class="welcome">
      <svg class="bubble-shape" viewBox="0 0 252 157" preserveAspectRatio="none" aria-hidden="true">
        <path d="M36 34C38 13 71 5 99 15c16-15 53-17 72 1 23-8 51 9 50 27 23 6 27 29 10 42 17 22-2 41-25 41-8 21-37 25-54 18-23 16-52 15-70 1-21 7-50-4-54-18C6 122-2 100 12 82-8 62 9 38 36 34Z" />
      </svg>
      <p class="welcome-text">
        <span v-for="line in copy.greeting" :key="line">{{ line }}</span>
      </p>
      <template v-for="{ dog, image } in greeters" :key="dog">
        <img v-if="image" :class="['greeting-dog', dog]" :src="image" alt="" width="370" height="370" />
      </template>
      <svg class="welcome-flourish" viewBox="0 0 390 110" preserveAspectRatio="none" aria-hidden="true">
        <path class="spark" d="m55 18-5-6m11 2-2-9m8 10 3-7" />
        <path class="title-heart" d="M348 24c-10-11-6-19-2-16 3 3 2 6 4 7s6-8 10-4c4 4-7 11-12 13Z" />
      </svg>
      <svg class="cloud-garden" viewBox="0 0 390 61" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-5 32q36-44 78-10 36-14 60 20 25-18 59 2 33-22 60-8 17-24 60-15 36-32 84 3v44H-5Z" />
        <path d="M-5 45q39-37 78-16 36-10 60 20 28-14 59 3 32-18 60-7 20-23 60-16 40-26 84 8v31H-5Z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.room-page {
  --room-ink: #714529;
  --room-hand: 'Kaiti SC', STKaiti, KaiTi, '楷体', serif;
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  min-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  color: var(--room-ink);
  background:
    radial-gradient(ellipse at 9% 5%, #f7e4c1a8, transparent 31%),
    radial-gradient(ellipse at 94% 89%, #f5e3bea8, transparent 33%),
    radial-gradient(ellipse at 60% 19%, #fffdf4, transparent 68%),
    #fcf2dd;
}
.chapter-head { padding-top: clamp(1rem, 5.5cqw, 2rem); }
.chapter-bar { position: relative; display: grid; place-items: center; min-height: 46px; margin-inline: 4%; }
.chapter-label { display: flex; align-items: center; gap: clamp(.3rem, 1.5cqw, .7rem); margin: 0; font-size: clamp(.7rem, 2.9cqw, 1.05rem); letter-spacing: .13em; font-weight: 750; white-space: nowrap; }
.chapter-label::before, .chapter-label::after { content: ''; width: clamp(.6rem, 4.5cqw, 1.7rem); height: 1.5px; border-radius: 50%; background: #dfad73; }
.round-button { position: absolute; inset-block-start: 0; width: 44px; height: 44px; display: grid; place-items: center; border: 1.5px solid #dfb983; border-radius: 51% 49% 48% 52%; background: #fff3d8a0; color: var(--room-ink); padding: 0; }
.round-button:active { scale: .95; background: #f6dfae; }
.round-button.back { inset-inline-start: 0; }
.round-button.music { inset-inline-end: 0; }
.round-button svg { width: 26px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
.round-button .muted-slash { stroke: #b6604d; stroke-width: 3; }
.chapter-progress { display: flex; justify-content: center; gap: .52rem; list-style: none; margin: .1rem 0 0; padding: 0; }
.mini-paw { display: block; width: .44rem; height: .32rem; margin-top: .23rem; border-radius: 50%; color: #d2ae80; background: currentColor; }
.mini-paw::before { content: ''; display: block; width: .15rem; height: .15rem; position: relative; left: .14rem; top: -.16rem; border-radius: 50%; background: currentColor; box-shadow: -.18rem .09rem currentColor, .18rem .09rem currentColor; }
.done .mini-paw { color: #925b35; }
.title-art { position: relative; isolation: isolate; display: grid; place-items: center; min-height: clamp(4rem, 18cqw, 6.5rem); padding: 0 10% .65rem; margin: .18rem 0 .1rem; }
h1 { margin: 0; font: 700 clamp(1.22rem, 7cqw, 2.55rem)/1.22 var(--room-hand); letter-spacing: -.055em; white-space: nowrap; transform: rotate(-1.5deg); text-shadow: .037em .037em currentColor; }
.title-flourish, .welcome-flourish { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
.title-heart, .spark, .swoosh { fill: none; stroke-linecap: round; stroke-linejoin: round; }
.spark { stroke: #eeb653; stroke-width: 1.8; }
.title-heart { stroke: #e48065; stroke-width: 2.2; }
.swoosh { stroke: #f3c670; stroke-width: 3; }
.room-caption { display: grid; justify-items: center; gap: clamp(.6rem, 3cqw, 1.2rem); text-align: center; padding: clamp(.4rem, 2.5cqw, .9rem) .55rem 0; }
.hint { display: flex; align-items: center; justify-content: center; gap: .38em; margin: 0; font: 700 clamp(.71rem, 3.65cqw, 1.16rem)/1.4 var(--room-hand); }
.hint span { color: #d7775a; font: 750 1.55em/1 var(--room-hand); }
.discovery { display: inline-flex; align-items: center; gap: .45em; min-height: 46px; margin: 0; padding: .24rem 1.05rem; border: 4px solid #f8dfad; border-radius: 2rem; outline: 1px dashed #d99c59; outline-offset: -5px; background: #fae9c2; font-size: clamp(.82rem, 3.6cqw, 1.2rem); font-weight: 720; letter-spacing: .04em; }
.discovery svg { width: 1.58em; height: 1.44em; fill: #c58343; }
.discovery strong { margin-inline-start: .25em; font-size: 1.38em; font-variant-numeric: tabular-nums; color: #ae562f; }
.discovery strong span { color: var(--room-ink); }
.room-actions:empty { display: none; }
.welcome { position: relative; isolation: isolate; flex: 1 0 auto; display: grid; place-items: center; min-height: clamp(10.7rem, 44cqw, 14.8rem); margin-top: clamp(.5rem, 2cqw, .95rem); padding-block: 1.35rem clamp(2.2rem, 10cqw, 3.3rem); overflow: hidden; }
.bubble-shape { position: absolute; top: .95rem; width: 61%; height: calc(100% - clamp(3rem, 14cqw, 4.45rem)); fill: #fff7e4; stroke: #cb975a; stroke-width: 2.1; z-index: -1; }
.welcome-text { width: 59%; margin: 0; text-align: center; font: 700 clamp(.74rem, 4.05cqw, 1.2rem)/1.46 var(--room-hand); }
.welcome-text span { display: block; }
.greeting-dog { position: absolute; z-index: 1; bottom: clamp(1rem, 5cqw, 1.8rem); width: 28%; height: auto; object-fit: contain; pointer-events: none; filter: sepia(.14) drop-shadow(0 .12rem .12rem #81552726); }
.greeting-dog.maltese { left: -1%; transform: rotate(-9deg); }
.greeting-dog.golden { right: -1%; transform: rotate(8deg); }
.welcome-flourish { top: auto; bottom: 18%; height: 69%; }
.cloud-garden { position: absolute; z-index: 2; bottom: 0; width: 100%; height: clamp(2.2rem, 10cqw, 3.3rem); pointer-events: none; }
.cloud-garden path:first-child { fill: #fff2ca; stroke: #f3c977; stroke-width: 4; }
.cloud-garden path:last-child { fill: #f6db9d; opacity: .58; }
</style>

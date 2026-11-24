<script setup lang="ts">
import type { HousePage } from './types'

defineProps<{ kind: HousePage }>()
</script>

<template>
  <svg viewBox="0 0 64 57" class="sticker" fill="none" aria-hidden="true">
    <g v-if="kind === 'albums'">
      <path d="m17 11 31-2 3 36-32 4Z" fill="#e8b68c" stroke="#955f48"/>
      <path d="m12 8 35 4-3 37-35-3Z" fill="#fff5d9" stroke="#92634a"/>
      <path d="m17 15 24 2-2 21-24-2Z" fill="#c8d29f" stroke="#8e936b"/>
      <path d="M28 32c-3-4-9-6-8-10 1-4 6-4 8 0 3-4 8-3 8 1 0 4-5 7-8 9Z" fill="#e8958a" stroke="#b67462"/>
    </g>
    <g v-else-if="kind === 'bouquet'">
      <path d="M31 50c2-15 1-23-1-32m4 25c5-13 5-15 12-18" stroke="#718453" stroke-linecap="round"/>
      <path d="M31 39c-3-7-6-7-11-7 0 7 7 9 11 7Zm4 3c5-10 10-9 14-12 0 7-6 12-14 12Z" fill="#a9b780" stroke="#798953"/>
      <path d="M18 11q3 4 8 7l5-9 6 8 8-6c1 12-4 19-13 20-11 0-15-8-14-20Z" fill="#efacb6" stroke="#ad6c71"/>
    </g>
    <g v-else-if="kind === 'cake'">
      <path d="M10 29h44v13c-2 11-39 12-44 0Z" fill="#eeb679" stroke="#a66c4e"/>
      <path d="M9 28c0-11 46-13 46 0v8q-5 5-9 1-5 7-12 1-7 6-12 0-8 4-13-1Z" fill="#fff0cd" stroke="#a66c4e"/>
      <path d="M31 27c-6-4-13-11-9-17 4-6 18-6 21 0 5 7-5 15-12 17Z" fill="#df8982" stroke="#aa5d55"/>
      <path d="m27 8 3 4 2-5 3 4 3-3" stroke="#75855a"/>
      <path d="m27 15 .4 1m7-2 .3 1m4 1 .4 1m-8 3 .5 .8" stroke="#fff0bd" stroke-linecap="round"/>
    </g>
    <g v-else-if="kind === 'games'">
      <path d="M12 24h39v23q-18 5-39 0Z" fill="#e8aab4" stroke="#a1716b"/>
      <path d="M8 19q24-4 47 0v9H8Z" fill="#f1b8ba" stroke="#a1716b"/>
      <path d="M28 18h8v31h-8Z" fill="#ffdf95"/>
      <path d="M32 17C8 8 14 0 26 8c3 2 4 4 6 9Zm0 0c7-20 29-13 10-2-4 2-7 2-10 2Z" fill="#ffde98" stroke="#b58657"/>
      <path d="m23 33 21 1" stroke="#e0989c" stroke-linecap="round"/>
    </g>
    <g v-else-if="kind === 'gifts'">
      <path d="m7 17 49-2 1 7q-7 2 0 7l1 9-49 2-1-8q7-4-1-8Z" fill="#fff0b6" stroke="#a77b4d"/>
      <path d="m18 20 1 15m27-16 1 15" stroke="#c09669" stroke-dasharray="2 3"/>
      <path d="M33 33c-4-2-11-7-8-11 2-2 5-1 8 2 2-3 6-4 8-1 2 3-5 8-8 10Z" fill="#e99da0" stroke="#a96c67"/>
    </g>
    <g v-else>
      <path d="m8 16 47-1 2 28-47 2Z" fill="#f5d6a1" stroke="#aa774f"/>
      <path d="m9 42 17-14m30 13L38 28M8 16l24 18 23-19" stroke="#aa774f" stroke-linecap="round"/>
      <path d="M32 33c-5-1-7-4-5-6 1-2 4-2 5 0 1-3 5-3 6 0 0 2-3 4-6 6Z" fill="#e99b91" stroke="#b87f6a"/>
    </g>
    <path d="m50 6 1 5m-4-2 6-1M9 40l-1 4m-3-3 5 1" stroke="#b9885f" opacity=".7" stroke-linecap="round"/>
  </svg>
</template>

<style scoped>
.sticker { width: clamp(2.5rem, 12vw, 3.45rem); height: auto; stroke-width: 1.55; stroke-linecap: round; stroke-linejoin: round; }
</style>

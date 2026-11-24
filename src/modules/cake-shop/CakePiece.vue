<script setup lang="ts">
import type { PieceKind } from './types'

defineProps<{ kind: PieceKind; dogArtwork?: string }>()
</script>

<template>
  <g stroke="#403a34" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round">
    <g v-if="kind === 'strawberry'">
      <path d="M-10-5Q-13-14-5-16Q0-18 5-15Q13-15 12-7Q11 3 2 8Q-4 10-10-5Z" fill="#e88a99" />
      <path d="M-6-14-8-19-1-17 2-21 5-16 10-17 6-12 0-14-5-11Z" fill="#9bb58c" />
      <path d="M-5-8l1 1m7-2 1 1m-4 5 1 1m4 0 1 1" stroke="#fff3d4" />
    </g>
    <g v-else-if="kind === 'mango'" fill="#efbd60">
      <path d="M-13 0-10-11-1-12 3-2-1 6Z" />
      <path d="M1 3 4-10 14-7 15 5 8 9Z" fill="#f3cc73" />
    </g>
    <g v-else-if="kind === 'blueberry'" fill="#8d9fcf">
      <circle cx="-7" cy="-2" r="7" /><circle cx="7" cy="0" r="7" /><circle cx="1" cy="-9" r="7" />
      <path d="M-2-11 1-8 4-11M-10-2l3 2 2-3M5 0l2 2 3-3" fill="none" />
    </g>
    <g v-else-if="kind === 'cherry'">
      <path d="M-7 0Q-7-11 4-16Q8-9 8 2" fill="none" stroke="#638065" />
      <path d="M4-16q6-6 12-1q-4 5-12 1Z" fill="#9bb58c" />
      <circle cx="-7" cy="0" r="7" fill="#db788c" /><circle cx="8" cy="3" r="7" fill="#d9647c" />
    </g>
    <g v-else-if="kind === 'kiwi'">
      <ellipse rx="13" ry="10" fill="#a9bc77" /><ellipse rx="5" ry="4" fill="#ece6ac" stroke="none" />
      <path d="M-8-4h1m6-2h1m7 2h1M-8 4h1m6 3h1m6-3h1" />
    </g>
    <path v-else-if="kind === 'heart'" d="M0 9C-26-6-9-23 0-12C9-23 26-6 0 9Z" fill="#e8a1b0" />
    <path v-else-if="kind === 'star'" d="M0-19 4-9 15-8 7-1 9 10 0 5-9 10-7-1-15-8-4-9Z" fill="#f4d17b" />
    <g v-else-if="kind === 'bow'" fill="#c2a8dc">
      <path d="M0-2Q-17-18-17-8L-15 6Q-13 12 0 2Q13 12 15 6L17-8Q17-18 0-2Z" />
      <ellipse rx="4.5" ry="4.8" />
    </g>
    <g v-else>
      <path d="M0-5v14" fill="none" />
      <rect x="-15" y="-30" width="30" height="28" rx="6" fill="#f6dfab" />
      <image v-if="dogArtwork" :href="dogArtwork" x="-14" y="-29" width="28" height="26" />
      <text v-else x="0" y="-14" stroke="none" text-anchor="middle" font-size="6" font-family="sans-serif" fill="#403a34">占位</text>
    </g>
  </g>
</template>

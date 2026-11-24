<script setup lang="ts">
import type { GiftKind } from './config'

defineProps<{ kind: GiftKind }>()
</script>

<template>
  <g stroke-width="1.6" stroke="#775744" stroke-linecap="round" stroke-linejoin="round">
    <g v-if="kind === 'gift'">
      <rect x="-14" y="-5" width="28" height="23" rx="3" fill="#edaaa7" />
      <rect x="-17" y="-11" width="34" height="8" rx="2.5" fill="#f4c5bd" />
      <path d="M-3-10h6v28h-6Z" fill="#f8de9c" stroke="none" />
      <path d="M0-11q-5-10-13-10-7 1-3 5 4 4 16 5Zm0 0q5-10 13-10 7 1 3 5-4 4-16 5Z" fill="#f6d894" />
    </g>
    <g v-else-if="kind === 'flower'">
      <path d="M1 4q-5 9-5 16m3-8q-9-7-12-2 3 5 11 5m1-1q9-9 13-3-3 5-12 5" fill="#a2bd95" stroke="#65866a" />
      <path d="M0-12C-12-26-20-12-12-6-29-4-13 10-7 4-8 18 9 14 8 5c12 7 23-9 8-11 8-10-7-18-16-6Z" fill="#fff2d3" />
      <circle cy="-4" r="6" fill="#e9c278" />
    </g>
    <g v-else-if="kind === 'berry'">
      <path d="M-15-4q0-12 15-11T15-4q-1 11-14 21Q-12 9-15-4Z" fill="#e98a9f" />
      <path d="m-11-15 5-2 2-5 5 4 6-3 3 6-9 4-4-3-4 3Z" fill="#a1b58e" stroke="#678362" />
      <path d="M-7-3v2m10-4v2m4 7v2m-9-2v2m4 5v1" stroke="#fff2c7" />
    </g>
    <g v-else-if="kind === 'cake'">
      <path d="M-17 0v11q0 6 17 6t17-6V0Z" fill="#e7b67f" />
      <path d="M-16 8q16 5 32 0" fill="none" stroke="#fde7b1" stroke-width="3" />
      <ellipse cy="-1" rx="17" ry="7" fill="#ffe5d9" />
      <path d="M-2-6v-11h4v11m-2-13q-4-3 0-7 4 4 0 7Z" fill="#f2c56e" />
    </g>
    <g v-else-if="kind === 'kiss'">
      <path d="M0 15C-18 3-22-3-16-12c4-5 13-4 16 2 4-6 13-7 17-2 6 9 0 15-17 27Z" fill="#eca0ae" />
      <path d="M-10-8q-4 2-2 6" stroke="#fff0df" stroke-width="2.2" fill="none" />
    </g>
    <g v-else-if="kind === 'letter'">
      <rect x="-18" y="-11" width="36" height="24" rx="4.3" fill="#fff1d8" />
      <path d="m-17-8 17 13L17-8M-16 10l9-7m23 7-9-7" fill="none" />
      <path d="M0 9c-10-6-5-12 0-8 5-4 10 2 0 8Z" fill="#df969f" />
    </g>
    <g v-else-if="kind === 'work'" stroke="#686878">
      <rect x="-24" y="-10" width="48" height="23" rx="6" fill="#c4cbd4" />
      <path d="M-12-2h24m-24 5H5m-17 5h18" stroke="#727782" />
      <circle cx="19" cy="-8" r="4" fill="#df9f9e" />
    </g>
    <g v-else stroke="#716781">
      <path d="M-13 10q-12-5-7-13 2-4 7-4-1-7 6-8 4-3 8 3 6-7 11 0 7-1 10 6 3 9-6 14-10 12-29 8Z" fill="#c8bed5" />
      <path d="m-8-2 3 2m13-3-3 3m-7 6q4-4 8 0" fill="none" />
    </g>
  </g>
</template>

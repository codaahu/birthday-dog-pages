<script setup lang="ts">
import type { FlowerKind } from './types'

defineProps<{ kind: FlowerKind; color: string }>()
</script>

<template>
  <g stroke="#403a34" stroke-width="1.55" stroke-linejoin="round" stroke-linecap="round">
    <g v-if="kind === 'tulip'">
      <path :fill="color" d="M-16-7Q-18-18-13-20L-4-13 0-23 8-14 15-19Q20 1 11 10Q0 20-11 9Z" />
      <path d="M-12-13Q-9 5 0 12M11-12Q12-1 6 6" fill="none" opacity=".47" />
    </g>
    <g v-else-if="kind === 'lisianthus'">
      <path :fill="color" d="M0 15C-11 18-22 7-17-2C-24-10-11-19-5-14C-4-25 10-21 11-13C23-14 26 1 16 4C16 16 7 18 0 15Z" />
      <path d="M-11-4Q-6 4 0 0Q5-7 12-6M-7 8Q0 12 7 5" fill="none" opacity=".55" />
    </g>
    <g v-else-if="kind === 'daisy' || kind === 'sunflower'">
      <ellipse v-for="petal in 10" :key="petal" cx="0" cy="-14" :rx="kind === 'daisy' ? 4.6 : 5.5"
        :ry="kind === 'daisy' ? 9 : 10.5" :transform="'rotate(' + petal * 36 + ')'" :fill="color" />
      <circle :r="kind === 'daisy' ? 6.8 : 10" :fill="kind === 'daisy' ? '#efc466' : '#926643'" />
      <path v-if="kind === 'sunflower'" d="M-4-3h.3M2-4h.3M-5 2h.3M4 1h.3M0 4h.3" stroke="#f4d99d" />
    </g>
    <g v-else-if="kind === 'rose'">
      <path :fill="color" d="M-18 0C-22-8-14-18-5-15C2-24 14-17 15-11C25-8 23 6 15 9C14 18 0 23-6 14C-16 17-21 8-18 0Z" />
      <path d="M-12 1C-10 14 8 14 12 4C16-5 4-13-3-8C-10-4-6 4 2 4C8 4 8-2 4-3M-15-7Q-12-13-5-14" fill="none" />
    </g>
    <g v-else-if="kind === 'hydrangea'">
      <circle v-for="(p, index) in [[-12,-8],[0,-15],[13,-7],[-11,6],[3,7],[15,6],[0,-2]]"
        :key="index" :cx="p[0]" :cy="p[1]" r="9" :fill="color" />
      <path d="M-14-9h3M-1-15h3M12-8h3M-12 6h3M2 8h3M15 6h3M-2-2h3" stroke="#fff9f0" />
    </g>
    <g v-else-if="kind === 'gypsophila'">
      <path d="M0 17Q0-4-16-12M0 17Q3-2 2-20M1 16Q10-7 17-10" fill="none" stroke="#677f67" />
      <circle v-for="(p, index) in [[-18,-14],[-12,-8],[-5,-13],[2,-21],[7,-14],[13,-9],[20,-11]]"
        :key="index" :cx="p[0]" :cy="p[1]" r="4.7" :fill="color" />
    </g>
    <g v-else>
      <path d="M-3 17Q1-5 6-24" fill="none" stroke="#677f67" />
      <ellipse v-for="(p, index) in [[-7,6,-29],[6,0,26],[-5,-4,-35],[8,-10,36],[-1,-14,-38],[8,-20,35]]"
        :key="index" :cx="p[0]" :cy="p[1]" rx="8" ry="4.2" :fill="color"
        :transform="'rotate(' + p[2] + ' ' + p[0] + ' ' + p[1] + ')'" />
    </g>
  </g>
</template>

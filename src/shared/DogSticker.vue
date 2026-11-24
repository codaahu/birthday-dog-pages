<script setup lang="ts">
import { assets, type Dog } from '../config/assets'

const base = import.meta.env.BASE_URL
withDefaults(defineProps<{ dog: Dog; action?: string; alt: string }>(), { action: 'happy' })
</script>

<template>
  <img
    v-if="assets.dogs[dog][action]"
    class="dog"
    :src="base + assets.dogs[dog][action]"
    :alt="alt"
    width="160" height="160"
    decoding="async"
  />
</template>

<style scoped>
.dog { width: 100%; max-width: 10rem; height: auto; aspect-ratio: 1; object-fit: contain; }
</style>

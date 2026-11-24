<script setup lang="ts">
import { theme } from './config/theme'

const themeVariables = Object.fromEntries(Object.entries(theme).map(([name, value]) => ['--' + name, value]))
</script>

<template>
  <div class="phone-shell" :style="themeVariables">
    <RouterView />
  </div>
</template>

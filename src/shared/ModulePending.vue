<script setup lang="ts">
import type { ModuleConfig } from '../core/story/contract'
import { theme } from '../config/theme'

defineProps<{ config: ModuleConfig }>()
</script>

<template>
  <section class="pending" :style="{ '--accent': theme[config.accent] }" :aria-label="config.title">
    <span class="seal" aria-hidden="true">✦</span>
    <h1>{{ config.title }}</h1>
    <p>这里还在准备中。</p>
    <slot />
  </section>
</template>

<style scoped>
.pending {
  min-height: 21rem;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.65rem;
  padding: clamp(1.3rem, 5vw, 2.75rem);
  text-align: center;
  background: var(--accent);
  border: 2px solid var(--ink);
  border-radius: 2.4rem 2rem 2.5rem 1.85rem;
}
.seal { display: grid; place-items: center; width: 3rem; height: 3rem; border: 1px solid; border-radius: 50%; }
h1 { margin: 0; }
p { margin: 0; color: var(--muted); }
</style>

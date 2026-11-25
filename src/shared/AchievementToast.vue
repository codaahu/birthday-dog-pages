<script setup lang="ts">
import { achievementCopy, achievementNames, type AchievementId } from '../config/achievements'

defineProps<{ achievement?: AchievementId; container?: HTMLDialogElement }>()
</script>

<template>
  <Teleport :to="container ?? 'body'">
    <aside class="toast-area" role="status" aria-live="polite" aria-atomic="true">
      <Transition name="prize">
        <div v-if="achievement" :key="achievement" class="toast">
          <svg viewBox="0 0 44 44" width="38" height="38" aria-hidden="true">
            <path d="m13 27-3 12 9-4 4 6 2-13m3-1 6 11 2-8 6-3-11-6" fill="#e9ac9f" stroke="#926141" stroke-width="1.6" stroke-linejoin="round" />
            <circle cx="22" cy="20" r="14" fill="#f5ce7c" stroke="#926141" stroke-width="1.7" />
            <path d="M22 13l2 4 4 1-3 3 1 5-4-2-4 2 1-5-3-3 4-1Z" fill="#fff6dc" stroke="#926141" stroke-width="1.3" stroke-linejoin="round" />
          </svg>
          <span>
            <small>已解锁成就</small>
            <strong>{{ achievementNames[achievement] }}</strong>
            <small v-if="achievementCopy[achievement]">{{ achievementCopy[achievement]?.message }}</small>
          </span>
        </div>
      </Transition>
    </aside>
  </Teleport>
</template>

<style scoped>
.toast-area { position: fixed; z-index: 100; inset-inline: 0; top: max(.75rem, env(safe-area-inset-top)); display: grid; justify-items: center; padding-inline: 1rem; pointer-events: none; color: #4a3428; }
.toast { display: flex; align-items: center; gap: .6rem; max-width: 100%; background: #fff5dd; border: 1.5px solid #b5814f; border-radius: 1rem .9rem 1.1rem .85rem; padding: .55rem 1.1rem .55rem .72rem; box-shadow: 0 .32rem .75rem #63432235; text-align: left; }
.toast small, .toast strong { display: block; }
.toast small { color: #885e39; font-size: .74rem; }
.toast strong { font-size: 1.03rem; }
.prize-enter-active, .prize-leave-active { transition: transform .24s ease, opacity .24s ease; }
.prize-enter-from, .prize-leave-to { transform: translateY(-14px); opacity: 0; }
@media (prefers-reduced-motion: reduce) { .prize-enter-active, .prize-leave-active { transition: none; } }
</style>

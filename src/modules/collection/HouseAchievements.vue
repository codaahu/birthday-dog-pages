<script setup lang="ts">
import { computed, ref } from 'vue'
import { achievementCopy, achievementNames, type AchievementId } from '../../config/achievements'
import type { Unlock } from '../../core/storage/types'
import { achievementGroups, legacyConditions } from './achievementGroups'
import HouseSticker from './HouseSticker.vue'

const props = defineProps<{ achievements: readonly Unlock[] }>()
const expanded = ref<AchievementId>()

// 旧隐藏成就与新版配置共同决定待解锁时的展示文案
const legacyHidden = new Set<AchievementId>(['dog-petting', 'funny-album', 'pet-discovery'])
const unlocked = computed(() => new Set(props.achievements.map(({ id }) => id)))

const groups = computed(() => achievementGroups.map((group) => {
  const rows = group.ids.map((id) => {
    const owned = unlocked.value.has(id)
    const copy = achievementCopy[id]
    const hidden = !owned && (copy?.hidden || legacyHidden.has(id))
    return {
      id, owned, hidden, name: hidden ? '？？？' : achievementNames[id],
      condition: copy?.condition ?? legacyConditions[id],
      message: copy?.message ?? '已解锁成就 · ' + achievementNames[id],
    }
  })
  return { ...group, rows, unlockedCount: rows.filter(({ owned }) => owned).length }
}))
const total = Object.keys(achievementNames).length
const unlockedCount = computed(() => groups.value.reduce((sum, group) => sum + group.unlockedCount, 0))

/**
 * 在整本图鉴内切换已解锁成就的小卡片
 *
 * @date 2026/11/25 12:15
 * @param id 当前点击的已解锁成就 ID
 */
function toggleAchievement(id: AchievementId) {
  expanded.value = expanded.value === id ? undefined : id
}
</script>

<template>
  <section class="achievement-shelf" aria-labelledby="achievement-shelf-title">
    <header class="achievement-header">
      <h3 id="achievement-shelf-title">成就图鉴</h3>
      <p>已解锁 <strong>{{ unlockedCount }}</strong> / {{ total }}</p>
      <progress :value="unlockedCount" :max="total" aria-label="成就解锁总进度" />
    </header>

    <details v-for="group in groups" :key="group.id" class="achievement-group" :class="group.id" :open="group.id === 'adventure'">
      <summary class="group-summary">
        <HouseSticker v-if="group.id === 'flowers' || group.id === 'cakes'" class="group-icon"
          :kind="group.id === 'flowers' ? 'bouquet' : 'cake'" aria-hidden="true" />
        <h4>{{ group.title }}</h4>
        <span class="group-count">{{ group.unlockedCount }} / {{ group.rows.length }}</span>
        <span class="caret" aria-hidden="true"></span>
      </summary>

      <ul class="achievement-rows">
        <li v-for="row in group.rows" :key="row.id">
          <template v-if="row.owned">
            <button type="button" class="achievement-row unlocked" :aria-expanded="expanded === row.id"
              :aria-controls="'achievement-card-' + row.id" @click="toggleAchievement(row.id)">
              <span class="medal" aria-hidden="true">✦</span>
              <span>{{ row.name }}</span>
              <small>已解锁</small>
              <span class="caret" aria-hidden="true"></span>
            </button>
            <dl v-show="expanded === row.id" :id="'achievement-card-' + row.id" class="achievement-card">
              <div><dt>完成条件</dt><dd>{{ row.condition }}</dd></div>
              <div><dt>解锁提示</dt><dd>{{ row.message }}</dd></div>
            </dl>
          </template>

          <div v-else class="achievement-row locked">
            <span class="medal" aria-hidden="true">◇</span>
            <span>{{ row.name }}</span>
            <small>{{ row.hidden ? '隐藏成就' : '待解锁' }}</small>
          </div>
        </li>
      </ul>
    </details>
  </section>
</template>

<style scoped>
.achievement-shelf { margin-top: .9rem; }
.achievement-header { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between;
  gap: .35rem .5rem; padding: 0 .16rem; margin-bottom: .64rem; }
.achievement-header h3 { margin: 0; font-size: 1.12rem; }
.achievement-header p { margin: 0; color: #725b4e; font-size: .76rem; font-variant-numeric: tabular-nums; }
.achievement-header strong { color: #405e40; font-size: .94rem; }
.achievement-header progress { appearance: none; width: 100%; height: .38rem; border: 0;
  background: #e9dec8; color: #81946a; border-radius: 1rem; overflow: hidden; }
.achievement-header progress::-webkit-progress-bar { background: #e9dec8; }
.achievement-header progress::-webkit-progress-value { background: #81946a; border-radius: 1rem; }
.achievement-header progress::-moz-progress-bar { background: #81946a; border-radius: 1rem; }

.achievement-group { --heading-color: #725b4e; --heading-fill: #f7efdd; border: 1px solid #e5d2b7;
  border-radius: .8rem; background: #fffdf5; margin-bottom: .43rem; }
.achievement-group.flowers { --heading-color: #405e40; --heading-fill: #eaf0de; }
.achievement-group.cakes { --heading-color: #7c4160; --heading-fill: #f7e7e9; }
.group-summary { display: grid; grid-template-columns: minmax(0, 1fr) auto .55rem; align-items: center; gap: .43rem;
  min-height: 44px; padding: .18rem .62rem; color: var(--heading-color); background: var(--heading-fill); cursor: pointer;
  border-radius: .73rem; list-style: none; }
.flowers .group-summary, .cakes .group-summary { grid-template-columns: 1rem minmax(0, 1fr) auto .55rem; }
.group-summary::-webkit-details-marker { display: none; }
.achievement-group[open] .group-summary { border-radius: .73rem .73rem 0 0; }
.group-summary h4 { margin: 0; font-size: .91rem; }
.group-icon { width: 1rem; height: 1rem; }
.group-count { font-size: .75rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
.caret { width: .37rem; height: .37rem; border: solid currentColor; border-width: 0 1.5px 1.5px 0; transform: rotate(-45deg); }
.achievement-group[open] .group-summary .caret, .achievement-row[aria-expanded="true"] .caret { transform: rotate(45deg); }

.achievement-rows { list-style: none; margin: 0; padding: 0 .45rem .28rem; }
.achievement-rows li + li { border-top: 1px solid #e8d9c2; }
.achievement-row { display: grid; grid-template-columns: .86rem minmax(0, 1fr) auto .55rem; align-items: center;
  gap: .34rem; min-height: 44px; width: 100%; padding: .25rem .15rem; text-align: left; color: #624d40; }
button.achievement-row { border: 0; background: transparent; }
button.achievement-row:focus-visible, .group-summary:focus-visible { outline-offset: -3px; }
.achievement-row.locked { grid-template-columns: .86rem minmax(0, 1fr) auto; padding-right: 1.04rem; }
.achievement-row small { white-space: nowrap; font-size: .69rem; }
.achievement-row.unlocked .medal, .achievement-row.unlocked small { color: #405e40; }
.achievement-row[aria-expanded="true"] > span:nth-child(2) { font-weight: 750; }
.medal { text-align: center; }
.achievement-card { margin: 0 .12rem .46rem 1.28rem; padding: .52rem .66rem; border-radius: .55rem; background: #f8ebd2;
  color: #624d40; font-size: .82rem; overflow-wrap: anywhere; }
.achievement-card > div + div { margin-top: .43rem; }
.achievement-card dt { color: #79551f; font-size: .72rem; font-weight: 750; }
.achievement-card dd { margin: .08rem 0 0; }
</style>

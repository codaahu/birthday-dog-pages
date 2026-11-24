<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { moduleIds } from '../config/storyFlow'
import { theme } from '../config/theme'
import { modules } from '../core/story/modules'
import { openFixture, scenarios, type Scenario } from './fixtures'

const route = useRoute()
const router = useRouter()
const selected = Object.keys(scenarios).find((key) => key === route.query.scene) as Scenario | undefined
const scenario = ref<Scenario>(selected ?? 'empty')
const feedback = ref('')
const resetting = ref(false)

/**
 * 更新开发大厅的测试场景，保留可分享的本地 URL
 *
 * @date 2026/11/24 10:54
 */
function selectScenario() {
  feedback.value = ''
  void router.replace({ name: 'dev', query: { scene: scenario.value } })
}

/**
 * 重置当前选中的开发存档
 *
 * @date 2026/11/24 10:54
 */
async function resetFixture() {
  const selected = scenario.value
  resetting.value = true
  try {
    const { db } = await openFixture(selected, true)
    db.close()
    feedback.value = '已重置「' + scenarios[selected] + '」的开发存档。'
  } catch (error) {
    console.error('重置当前开发存档失败', error)
    feedback.value = '暂时无法重置开发存档，请重试。'
  } finally {
    resetting.value = false
  }
}
</script>

<template>
  <main class="hall">
    <header class="hero">
      <div>
        <p class="eyebrow">生日快递 · 开发预览</p>
        <h1>生日小世界<br />调试大厅</h1>
        <p class="intro">选一个测试场景，直接打开任意模块。</p>
      </div>
      <div class="illustration" aria-hidden="true">
        <span class="sparkle first">✦</span>
        <span class="sparkle second">✧</span>
        <div class="letter"><span>♡</span></div>
        <div class="envelope"></div>
      </div>
    </header>

    <section class="tools" aria-labelledby="scenario-title">
      <div class="scenario-copy">
        <h2 id="scenario-title">测试场景</h2>
        <p>各场景独立存档，切换不会覆盖记录。</p>
      </div>
      <div class="controls">
        <select v-model="scenario" aria-label="测试场景" :disabled="resetting" @change="selectScenario">
          <option v-for="(label, key) in scenarios" :key="key" :value="key">{{ label }}</option>
        </select>
        <button type="button" class="secondary" :disabled="resetting" @click="resetFixture">重置当前场景</button>
      </div>
      <p v-if="feedback" class="feedback" role="status">{{ feedback }}</p>
    </section>

    <section aria-labelledby="module-title">
      <h2 id="module-title" class="modules-title">独立模块</h2>
      <ul class="module-grid">
        <li v-for="id in moduleIds" :key="id">
          <RouterLink :to="{ name: 'dev-module', params: { moduleId: id }, query: { scene: scenario } }"
            class="module-card" :style="{ '--accent': theme[modules[id].config.accent] }">
            <span class="sticker" aria-hidden="true"></span>
            <span><strong>{{ modules[id].config.title }}</strong><small>可玩预览</small></span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.hall { width: min(100%, 59rem); margin-inline: auto; padding-block: clamp(1rem, 5vw, 3.25rem) 2rem; }
.hero { position: relative; isolation: isolate; overflow: hidden; min-height: 16rem; padding: clamp(1.5rem, 5vw, 3rem); border: 2px solid; border-radius: 2.2rem 2rem 2.4rem 1.9rem; background: #fae9c3; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; }
.eyebrow { margin: 0 0 0.55rem; font-size: 0.88rem; font-weight: 760; }
h1 { line-height: 1.12; margin: 0; font-size: clamp(2.35rem, 7.4vw, 4.25rem); letter-spacing: -0.07em; }
.intro { margin: 0.85rem 0 0; color: var(--muted); }
.illustration { flex: 0 0 min(34vw, 16rem); position: relative; height: clamp(7rem, 20vw, 12rem); transform: rotate(10deg); }
.letter { position: absolute; width: 69%; height: 75%; left: 13%; top: 5%; background: var(--white); border: 2px solid; border-radius: 0.8rem; transform: rotate(-14deg); display: grid; justify-items: center; }
.letter span { font-size: clamp(2rem, 7vw, 3.5rem); color: #965963; line-height: 1.1; }
.envelope { position: absolute; inset: 42% 0 4%; background: var(--pink); border: 2px solid; border-radius: 0.8rem; overflow: hidden; }
.envelope::before { content: ''; position: absolute; width: 75%; height: 115%; left: 12%; top: -62%; transform: rotate(35deg) skew(-20deg); background: #f7dce0; border: 2px solid; border-radius: 0.5rem; }
.sparkle { position: absolute; z-index: 1; font-size: clamp(1rem, 4vw, 2rem); }
.first { right: 0; top: -12%; }
.second { left: -8%; bottom: 2%; }
.tools { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.85rem 1.5rem; background: #fffdf8; border: 1px solid #dfd3c3; border-radius: 1.15rem; margin-block: 1.3rem 1.6rem; padding: 1.05rem 1.2rem; }
h2 { margin: 0; font-size: 1.15rem; }
.scenario-copy p, .feedback { margin: 0.2rem 0 0; font-size: 0.875rem; color: var(--muted); }
.feedback { width: 100%; }
.controls { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.controls select { padding: 0.55rem 0.85rem; border: 1px solid var(--ink); border-radius: 0.8rem; background: var(--white); color: var(--ink); }
.modules-title { margin-bottom: 0.7rem; }
.module-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.65rem; margin: 0; padding: 0; list-style: none; }
.module-card { display: flex; align-items: center; gap: 0.65rem; height: 100%; min-height: 4.65rem; padding: 0.62rem 0.8rem; border: 1px solid #cbbdad; border-radius: 1rem 0.94rem 1rem 0.86rem; background: #fffdf8; color: inherit; text-decoration: none; }
.module-card:hover { background: var(--accent); border-color: var(--ink); }
.module-card small { display: block; font-size: 0.8rem; margin-top: 0.18rem; color: var(--muted); }
.sticker { flex: 0 0 1.8rem; height: 1.8rem; background: var(--accent); border: 1px solid var(--ink); border-radius: 37% 44% 40% 43%; transform: rotate(-12deg); }
@media (max-width: 700px) { .module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 420px) {
  .hero { gap: 0.4rem; padding: 1.25rem; min-height: 12rem; }
  .illustration { flex-basis: 30%; }
  .module-card { padding-inline: 0.55rem; gap: 0.45rem; }
  .sticker { flex-basis: 1.25rem; height: 1.25rem; }
}
@media (max-width: 340px) { .module-grid { grid-template-columns: 1fr; } }
</style>

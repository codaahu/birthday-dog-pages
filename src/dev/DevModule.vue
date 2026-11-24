<script setup lang="ts">
import { computed, onUnmounted, shallowRef, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { emptyPhotos } from '../config/photos'
import type { ModuleId } from '../config/storyFlow'
import { SceneAudio } from '../core/audio'
import { collectionSelection, loadPhotos, moduleContext } from '../core/story/context'
import type { CollectionControls, ModuleCompletion } from '../core/story/contract'
import { modules } from '../core/story/modules'
import type { Settings } from '../core/storage/types'
import { openFixture, previewTime, scenarioPhotos, singlePhoto, scenarios, type Scenario } from './fixtures'

const route = useRoute()
const router = useRouter()
const scenario = computed(() => {
  const requested = route.query.scene
  return (Object.keys(scenarios).find((key) => key === requested) as Scenario | undefined)
    ?? (route.params.moduleId === 'gashapon' ? 'balance'
      : route.params.moduleId === 'ending' ? 'ending' : route.params.moduleId === 'collection' ? 'collection' : 'empty')
})
const id = computed(() => route.params.moduleId as ModuleId)
const current = computed(() => modules[id.value])
const roomPage = computed(() => id.value === 'memory-room')
const sceneOnly = computed(() => id.value === 'opening' || id.value === 'flower-shop' || id.value === 'cake-shop'
  || id.value === 'catch-gifts' || id.value === 'couple-quiz' || id.value === 'gashapon' || id.value === 'meeting'
  || id.value === 'ending' || id.value === 'collection' || roomPage.value)
const preview = shallowRef<{
  context: ReturnType<typeof moduleContext>
  balance: number
  completed: boolean
  works: number
  results: number
  weekend: boolean
  step: string
  settings: Settings
  commitEnding?: () => Promise<boolean>
  houseControls?: CollectionControls
  updateSettings: (changes: Partial<Settings>) => Promise<void>
}>()
const notice = ref('')
const unavailable = ref(false)
const endingPending = ref(false)
const audio = new SceneAudio()
const fromHouse = computed(() => route.query.from === 'house')
const roomControls = computed(() => roomPage.value && preview.value ? {
  music: preview.value.settings.music,
  toggleMusic,
  exit: () => router.push(fromHouse.value
    ? { name: 'dev-module', params: { moduleId: 'collection' }, query: { scene: scenario.value } }
    : { name: 'dev', query: { scene: scenario.value } }),
} : undefined)

onUnmounted(() => audio.dispose())
watch([current, preview], ([entry, state]) => {
  if (entry && state) {
    audio.configure(entry.config.music, { ...state.settings, music: (roomPage.value || id.value === 'collection') && state.settings.music })
  }
})

watch([id, scenario, () => route.fullPath], async ([moduleId, selected], _previous, onCleanup) => {
  let cancelled = false
  let close: (() => void) | undefined
  onCleanup(() => { cancelled = true; close?.() })
  preview.value = undefined
  notice.value = ''
  unavailable.value = false
  endingPending.value = false

  try {
    const services = await openFixture(selected)
    close = () => services.db.close()
    if (cancelled) {
      close()
      return
    }

    const [state, history, balance, photos] = await Promise.all([
      services.story.session(), services.history.read(), services.rewards.balance(),
      selected === 'photos' ? loadPhotos() : selected === 'empty' ? emptyPhotos : selected === 'progress' ? singlePhoto : scenarioPhotos,
    ])
    if (!cancelled) {
      const endingRun = moduleId === 'ending' && selected === 'ending' ? state.run : undefined
      const houseControls = moduleId === 'collection' ? devHouseControls(services, selected, state) : undefined
      preview.value = {
        context: moduleContext('dev', services, fromHouse.value ? undefined : state.run, photos, previewTime(selected), moduleId,
          fromHouse.value ? collectionSelection(route.query) : undefined),
        balance,
        completed: state.profile.everCompleted,
        works: history.works.length,
        results: history.results.length,
        weekend: history.tickets.some((ticket) => ticket.rarity === 'SSR'),
        step: state.run ? modules[state.run.step].config.title : '',
        settings: state.profile.settings,
        commitEnding: endingRun ? async () => Boolean(await services.story.complete(endingRun.id, 'ending', 'completed')) : undefined,
        houseControls,
        updateSettings: (changes) => services.story.updateSettings(changes),
      }
    }
  } catch (error) {
    if (!cancelled) {
      console.error('加载模块开发预览失败', error)
      notice.value = '暂时无法读取开发存档，请重新打开预览。'
      unavailable.value = true
    }
  }
}, { immediate: true })

/**
 * 接通收藏预览的导航和重玩操作，只使用当前开发场景的存档
 *
 * @date 2026/11/24 19:31
 * @param services 隔离的开发存档服务
 * @param scene 当前测试场景
 * @param state 场景的已读取档案
 * @return 与正式小屋使用同一套视图控制契约
 */
function devHouseControls(services: Awaited<ReturnType<typeof openFixture>>, scene: Scenario,
  state: Awaited<ReturnType<typeof services.story.session>>): CollectionControls {
  const controls: CollectionControls = {
    settings: state.profile.settings,
    canResume: state.run?.kind === 'replay' && state.run.status !== 'completed',
    busy: false,
    openModule: (target, selection) => {
      void router.push({ name: 'dev-module', params: { moduleId: target }, query: { scene, from: 'house',
        work: selection?.workId, album: selection?.album, puzzle: selection?.puzzle ? '1' : undefined } })
    },
    replay: async (action) => {
      if (controls.busy) {
        return
      }
      controls.busy = true
      try {
        const run = action === 'start' ? await services.story.startReplay()
          : state.run ? await services.story.setReplayActive(true, state.run.id) : undefined
        if (run) {
          await router.push({ name: 'dev-module', params: { moduleId: run.step }, query: { scene } })
        } else {
          notice.value = '此测试存档还不能重玩。'
        }
      } catch (error) {
        console.error('切换开发小屋的冒险失败', error)
        notice.value = '暂时无法开启这次测试冒险。'
      } finally {
        controls.busy = false
      }
    },
    updateSettings: async (changes) => {
      await services.story.updateSettings(changes)
      await controls.refresh()
    },
    refresh: async () => {
      state = await services.story.session()
      if (preview.value?.context.data.history === services.history) {
        preview.value = { ...preview.value, settings: state.profile.settings,
          houseControls: { ...controls, settings: state.profile.settings,
            canResume: state.run?.kind === 'replay' && state.run.status !== 'completed' } }
      }
    },
  }
  return controls
}

/**
 * 在调试界面显示模块真实上报的状态
 *
 * @date 2026/11/24 19:09
 * @param result 模块通过统一事件上报的结果
 */
async function report(result: ModuleCompletion) {
  const active = preview.value
  if (active?.commitEnding && result.status === 'completed') {
    if (endingPending.value || active.completed) {
      return
    }
    endingPending.value = true
    try {
      const completed = await active.commitEnding()
      if (preview.value === active) {
        if (completed) {
          preview.value = { ...active, completed: true }
          notice.value = '测试存档已保存通关，小屋已解锁。'
        } else {
          notice.value = '暂时无法保存测试结算，请刷新预览。'
        }
      }
    } catch (error) {
      console.error('保存开发结算预览失败', error)
      if (preview.value === active) {
        notice.value = '测试结算未保存，请重试。'
      }
    } finally {
      if (preview.value?.context === active.context) {
        endingPending.value = false
      }
    }
    return
  }
  notice.value = '收到模块事件 · ' + (result.status === 'completed' ? '完成' : '跳过')
}

/**
 * 在独立开发存档中切换小屋音乐设置
 *
 * @date 2026/11/24 14:23
 */
async function toggleMusic() {
  const active = preview.value
  if (!active) {
    return
  }
  const music = !active.settings.music
  try {
    await active.updateSettings({ music })
    if (preview.value === active) {
      preview.value = { ...active, settings: { ...active.settings, music } }
    }
  } catch (error) {
    console.error('保存开发预览音乐开关失败', error)
    notice.value = '音乐设置未保存，请重试。'
  }
}
</script>

<template>
  <main class="preview" :class="{ 'scene-preview': sceneOnly, 'room-preview': roomPage }"
    @click.capture="(roomPage || id === 'collection') && audio.activate()">
    <header v-if="!sceneOnly" class="toolbar">
      <RouterLink class="secondary" :to="{ name: 'dev', query: { scene: scenario } }">返回调试大厅</RouterLink>
      <span>{{ scenarios[scenario] }}</span>
    </header>

    <p v-if="notice && !sceneOnly" role="status">{{ notice }}</p>
    <p v-if="!preview && !unavailable" role="status">正在打开开发场景…</p>

    <template v-if="current && preview">
      <component :is="current.component" :key="id + ':' + scenario + (preview.commitEnding && preview.completed ? ':saved' : '')"
        :context="preview.context" v-bind="roomControls ? { roomControls } : preview.houseControls ? { houseControls: preview.houseControls } : id === 'ending'
          ? { completionPending: endingPending || Boolean(preview.commitEnding && preview.completed) } : {}"
        @completed="report" @request-exit="router.push({ name: 'dev', query: { scene: scenario } })" />
      <section v-if="!sceneOnly" class="details" aria-labelledby="fixture-title">
        <h2 id="fixture-title">开发测试数据</h2>
        <dl class="facts">
          <div><dt>当前关卡</dt><dd>{{ preview.step }}</dd></div>
          <div><dt>首次通关</dt><dd>{{ preview.completed ? '已通关' : '未通关' }}</dd></div>
          <div><dt>狗狗币</dt><dd>{{ preview.balance }}</dd></div>
          <div><dt>照片</dt><dd>{{ preview.context.photos.photos.length }}</dd></div>
          <div><dt>作品</dt><dd>{{ preview.works }}</dd></div>
          <div><dt>游戏记录</dt><dd>{{ preview.results }}</dd></div>
          <div><dt>周末见面券</dt><dd>{{ preview.weekend ? '已领取' : '未领取' }}</dd></div>
        </dl>
      </section>

    </template>
    <footer v-if="sceneOnly && (!roomPage || !preview || notice)" class="scene-tools">
      <p v-if="notice" role="status">{{ notice }}</p>
      <RouterLink v-if="fromHouse" :to="{ name: 'dev-module', params: { moduleId: 'collection' }, query: { scene: scenario } }">返回生日小屋</RouterLink>
      <RouterLink v-else-if="!roomPage || !preview" :to="{ name: 'dev', query: { scene: scenario } }">返回调试大厅</RouterLink>
    </footer>
  </main>
</template>

<style scoped>
.preview { max-width: 43rem; padding-block: clamp(1rem, 5vw, 2.5rem); margin-inline: auto; }
.scene-preview { padding-top: .45rem; }
.room-preview { padding-block: 0; }
@media (max-width: 39rem) {
  .room-preview { margin-inline: calc(0px - max(.85rem, min(env(safe-area-inset-left), env(safe-area-inset-right)))); }
}
.scene-tools { max-width: 27rem; margin: .18rem auto 0; text-align: center; color: var(--muted); font-size: .75rem; }
.scene-tools a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 .65rem; color: inherit; text-underline-offset: 3px; }
.toolbar { display: flex; gap: 0.7rem; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; }
.toolbar span { font-size: 0.875rem; color: var(--muted); }
.details { margin: 0.9rem 0 0; border: 1px solid #dfd3c3; background: #fffdf8; border-radius: 1.1rem; padding: 1rem; }
h2 { margin: 0; font-size: 1.1rem; }
p { margin: 0.35rem 0; }
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(7.8rem, 1fr)); gap: 0.65rem; margin-bottom: 0; }
dt { color: var(--muted); font-size: 0.82rem; }
dd { margin: 0; font-weight: 700; }
</style>

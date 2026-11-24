<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { sceneEntryImages } from '../../config/assets'
import { emptyPhotos } from '../../config/photos'
import { chapters, storyFlow, type ModuleId } from '../../config/storyFlow'
import { SceneAudio } from '../audio'
import type { Profile, Run, Settings } from '../storage/types'
import { collectionSelection, loadPhotos, moduleContext } from './context'
import type { CollectionControls, CollectionSelection, ModuleCompletion } from './contract'
import { prefetchImage } from './imagePreload'
import { modules } from './modules'
import { services } from './runtime'

const route = useRoute()
const router = useRouter()
const profile = ref<Profile>()
const run = ref<Run>()
const photos = ref(emptyPhotos)
const busy = ref(false)
const errorMessage = ref('')
const mode = computed(() => route.name === 'story' ? 'story' : 'collection')
const id = computed(() => (route.params.moduleId || 'collection') as ModuleId)
const current = computed(() => modules[id.value])
const activeRun = computed(() => mode.value === 'story' ? run.value : undefined)
const context = computed(() => moduleContext(mode.value, services, activeRun.value, photos.value, Date.now(), id.value,
  mode.value === 'collection' && id.value !== 'collection' ? collectionSelection(route.query) : undefined))
const audio = new SceneAudio()
const sceneRoot = ref<HTMLElement>()
// 回忆小屋在自己的页首呈现现有主线控件
const roomPage = computed(() => id.value === 'memory-room')
const housePage = computed(() => id.value === 'collection')
const houseControls = computed<CollectionControls | undefined>(() => housePage.value && profile.value ? {
  settings: profile.value.settings,
  canResume: run.value?.kind === 'replay' && run.value.status !== 'completed',
  busy: busy.value,
  openModule: openHouseModule,
  replay,
  updateSettings: updateHouseSettings,
  refresh: refreshHouseSession,
} : undefined)
const roomControls = computed(() => roomPage.value && profile.value ? {
  music: profile.value.settings.music,
  toggleMusic,
  exit: mode.value === 'collection' || activeRun.value?.kind === 'replay' ? requestExit : undefined,
  chapters: mode.value === 'story' ? chapters.map(({ id }) => Boolean(activeRun.value?.chapters[id])) : undefined,
} : undefined)

onMounted(() => {
  void loadPhotos().then((manifest) => { photos.value = manifest })
})
onUnmounted(() => audio.dispose())
watch([id, mode, () => Boolean(profile.value)], ([step, sceneMode, ready]) => {
  if (ready && sceneMode === 'story' && step !== 'opening') {
    void preloadNextScene(step)
  }
}, { flush: 'post' })
watch([current, profile], () => {
  if (current.value && profile.value) {
    audio.configure(current.value.config.music, profile.value.settings)
  }
}, { immediate: true })
watch(() => route.fullPath, async (_path, _oldPath, onCleanup) => {
  let cancelled = false
  onCleanup(() => { cancelled = true })
  try {
    const state = await services.story.session()
    if (!cancelled) {
      run.value = state.run
      profile.value = state.profile
    }
  } catch (error) {
    console.error('读取当前冒险档案失败', error)
    if (!cancelled) {
      errorMessage.value = '无法读取本机存档，请刷新重试。'
    }
  }
}, { immediate: true })

/**
 * 将模块结果提交给主线并在成功保存后前进
 *
 * @date 2026/11/24 10:54
 * @param result 当前剧情模块上报的完成或跳过结果
 */
async function complete(result: ModuleCompletion) {
  const currentRun = activeRun.value
  if (!currentRun || busy.value || currentRun.step !== id.value) {
    return
  }
  busy.value = true
  errorMessage.value = ''
  try {
    const next = await services.story.complete(currentRun.id, currentRun.step, result.status, result.statistics)
    if (next) {
      run.value = next
      await router.replace(next.status === 'completed' ? { name: 'collection' } : { name: 'story', params: { moduleId: next.step } })
    } else {
      errorMessage.value = '这一步暂时无法保存，请确认当前关卡后重试。'
    }
  } catch (error) {
    console.error('保存当前关卡结果失败', error)
    errorMessage.value = '这一步还没保存成功，请重试。'
  } finally {
    busy.value = false
  }
}

/**
 * 切换现有重玩或在确认后开启新一轮
 *
 * @date 2026/11/24 19:27
 * @param action 新开、继续或暂停本轮重玩
 */
async function replay(action: 'start' | 'resume' | 'pause') {
  if (busy.value || (action !== 'start' && !run.value)) {
    return
  }
  busy.value = true
  errorMessage.value = ''
  try {
    const updated = action === 'start'
      ? await services.story.startReplay()
      : await services.story.setReplayActive(action === 'resume', run.value!.id)
    if (updated) {
      run.value = updated
      await router.push(action === 'pause' ? { name: 'collection' } : { name: 'story', params: { moduleId: updated.step } })
    } else {
      errorMessage.value = '存档已在其他页面更新，请刷新重试。'
    }
  } catch (error) {
    console.error('切换重玩失败', error)
    errorMessage.value = '暂存进度失败，请重试。'
  } finally {
    busy.value = false
  }
}

/**
 * 退出独立模块或暂停重玩
 *
 * @date 2026/11/24 10:54
 */
function requestExit() {
  if (mode.value === 'collection') {
    void router.push({ name: 'collection' })
  } else if (activeRun.value?.kind === 'replay') {
    void replay('pause')
  }
}

/**
 * 响应主动点击并持久化音乐开关
 *
 * @date 2026/11/24 10:54
 */
async function toggleMusic() {
  if (!profile.value) {
    return
  }
  const settings = { ...profile.value.settings, music: !profile.value.settings.music }
  try {
    await services.story.updateSettings({ music: settings.music })
    profile.value = { ...profile.value, settings }
  } catch (error) {
    console.error('保存音乐开关失败', error)
    errorMessage.value = '音乐设置未保存，请重试。'
  }
}

/**
 * 在通过永久权限校验后打开独立玩法
 *
 * @date 2026/11/24 19:27
 * @param target 目标模块
 * @param selection 收藏的作品或相册，可省略
 */
function openHouseModule(target: ModuleId, selection?: CollectionSelection) {
  void router.push({ name: 'collection', params: { moduleId: target },
    query: { work: selection?.workId, album: selection?.album, puzzle: selection?.puzzle ? '1' : undefined } })
}

/**
 * 保存生日小屋的音频设置
 *
 * @date 2026/11/24 19:27
 * @param changes 这次修改的音频设置
 */
async function updateHouseSettings(changes: Partial<Settings>) {
  await services.story.updateSettings(changes)
  await refreshHouseSession()
}

/**
 * 备份合并或设置修改后刷新主控中的档案
 *
 * @date 2026/11/24 19:27
 */
async function refreshHouseSession() {
  const state = await services.story.session()
  run.value = state.run
  profile.value = state.profile
}


/**
 * 当前图就绪后，预取主线下一关的首屏图片
 *
 * @author 何齐龙
 * @date 2026/11/24 22:48
 * @param step 当前主线关卡，用于选择下一关并判断是否已离开
 */
async function preloadNextScene(step: ModuleId) {
  if (mode.value !== 'story' || step === 'collection') {
    return
  }

  await nextTick()
  // 等当前关卡的现有图片，预取不会抢首屏请求
  const currentImages = Array.from(sceneRoot.value?.querySelectorAll('img, svg image') ?? [])
  await Promise.allSettled(currentImages.map((image) => {
    if (image instanceof HTMLImageElement) {
      return image.decode()
    }
    const source = image.getAttribute('href')
    return source ? prefetchImage(source) : undefined
  }))

  const next = storyFlow[storyFlow.indexOf(step) + 1] ?? 'collection'
  for (const path of sceneEntryImages[next]) {
    if (mode.value !== 'story' || id.value !== step) {
      return
    }
    if (path) {
      await prefetchImage(import.meta.env.BASE_URL + path)
    }
  }
}
</script>

<template>
  <main ref="sceneRoot" class="story" :class="{ 'room-story': roomPage }" @click.capture="audio.activate()">
    <header v-if="profile && !roomPage && !housePage" class="bar">
      <ol v-if="mode === 'story'" class="progress" aria-label="冒险进度">
        <li v-for="chapter in chapters" :key="chapter.id" :class="{ done: activeRun?.chapters[chapter.id] }">
          <span class="paw" aria-hidden="true"></span>
          <span class="sr-only">{{ activeRun?.chapters[chapter.id] ? '已走过一站' : '待探索一站' }}</span>
        </li>
      </ol>
      <RouterLink v-else-if="id !== 'collection'" class="secondary" :to="{ name: 'collection' }">返回小屋</RouterLink>
      <span v-else></span>
      <button type="button" class="secondary" :aria-pressed="profile.settings.music" @click="toggleMusic">
        音乐{{ profile.settings.music ? '开' : '关' }}
      </button>
    </header>

    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
    <component v-if="current && profile" :is="current.component" :key="id + ':' + mode + (context.collectionSelection ? ':' + route.fullPath : '')"
      :context="context" v-bind="roomControls ? { roomControls } : houseControls ? { houseControls }
        : id === 'ending' ? { completionPending: busy } : {}"
      @dialogue-ready="preloadNextScene('opening')" @completed="complete" @request-exit="requestExit" />

    <div v-if="!roomPage && mode === 'story' && activeRun?.kind === 'replay'" class="actions">
      <button class="secondary" type="button" :disabled="busy" @click="replay('pause')">返回小屋</button>
    </div>
  </main>
</template>

<style scoped>
.story { max-width: 44rem; margin-inline: auto; padding-block: clamp(0.75rem, 5vw, 2.75rem); }
.story.room-story { padding-block: 0; }
@media (max-width: 39rem) {
  .room-story { margin-inline: calc(0px - max(.85rem, min(env(safe-area-inset-left), env(safe-area-inset-right)))); }
}
.bar, .actions { display: flex; align-items: center; justify-content: space-between; gap: 0.65rem; }
.bar { margin-block-end: 0.85rem; }
.actions { justify-content: flex-start; flex-wrap: wrap; margin-block-start: 0.85rem; }
.actions p { width: 100%; }
.progress { display: flex; align-items: center; gap: 0.72rem; margin: 0; padding: 0; list-style: none; }
.paw { display: block; position: relative; width: 0.65rem; height: 0.49rem; margin-block-start: 0.35rem; background: #d7c9b6; border-radius: 48%; transform: rotate(-13deg); }
.paw::before { content: ''; position: absolute; width: 0.23rem; height: 0.25rem; top: -0.21rem; left: 0.21rem; border-radius: 50%; background: inherit; box-shadow: -0.27rem 0.14rem #d7c9b6, 0.27rem 0.14rem #d7c9b6; }
.done .paw, .done .paw::before { background: var(--ink); }
.done .paw::before { box-shadow: -0.27rem 0.14rem var(--ink), 0.27rem 0.14rem var(--ink); }
</style>

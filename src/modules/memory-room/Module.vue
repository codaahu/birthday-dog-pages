<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { AchievementId } from '../../config/achievements'
import { dialogue } from '../../config/dialogue'
import { personal } from '../../config/personal'
import type { ModuleCompletion } from '../../core/story/contract'
import { prefetchImage } from '../../core/story/imagePreload'
import { newId } from '../../core/storage/id'
import AchievementToast from '../../shared/AchievementToast.vue'
import { useAchievementToast } from '../../shared/useAchievementToast'
import AlbumViewer from './AlbumViewer.vue'
import PuzzleBoard from './PuzzleBoard.vue'
import RoomArt from './RoomArt.vue'
import RoomPageFrame from './RoomPageFrame.vue'
import { isSolved, shuffledTiles, swapTiles, type PuzzleState } from './puzzle'
import {
  albumTitles, availableAlbums, foodHotspots, mainMemoryPoints, puzzlePhotos, roomDiscoveryAchievements, roomProgress,
  type AlbumCategory, type HotspotId,
} from './room'
import type { ModuleProps } from './types'

const props = defineProps<ModuleProps>()
const emit = defineEmits<{ completed: [result: ModuleCompletion] }>()
type Panel = 'album' | 'shelf' | 'puzzle' | 'funny' | 'transition'
const panel = ref<Panel>()
const backgroundReady = ref(false)
const dialog = ref<HTMLDialogElement>()
const panelClose = ref<HTMLButtonElement>()
const category = ref<AlbumCategory>('couple')
const albumIndex = ref(0)
const puzzle = ref<PuzzleState | undefined>(props.context.draft?.puzzle as PuzzleState | undefined)
const explored = ref<AlbumCategory[]>((props.context.draft?.explored as AlbumCategory[] | undefined) ?? [])
const visited = ref<HotspotId[]>((props.context.draft?.visited as HotspotId[] | undefined) ?? [])
const { visible: newAchievement, notify } = useAchievementToast()
// 已存在或刚写入成功的成就不重复请求和弹出
const earned = new Set<AchievementId>()
const launchedFrom = ref<HTMLElement>()
const funnyUnlocked = ref(false)
const funnyStep = ref(0)
const busy = ref(false)
const errorMessage = ref('')
const clock = ref(Date.now())
let startedAt: number | undefined
let ticker: ReturnType<typeof setInterval> | undefined
let petTimer: ReturnType<typeof setTimeout> | undefined
let petTaps = 0
let visitedNeedsSave = false

const photos = computed(() => props.context.photos.photos)
const albums = computed(() => availableAlbums(photos.value))
const shelfAlbums = computed(() => albums.value.filter((item) => item === 'engagement' || item === 'travel'))
const currentAlbum = computed(() => photos.value.filter((photo) => photo.category === category.value))
const choices = computed(() => puzzlePhotos(photos.value))
const puzzlePhoto = computed(() => choices.value.find((photo) => photo.id === puzzle.value?.photoId))
const progress = computed(() => roomProgress(albums.value, explored.value, Boolean(puzzle.value?.status)))
const elapsed = computed(() => (puzzle.value?.timeMs ?? 0) + (startedAt === undefined ? 0 : Math.max(0, clock.value - startedAt)))
const foundMemories = computed(() => mainMemoryPoints.filter(({ id }) => visited.value.includes(id)).length)
const readyForCollection = ref(false)
const petUnlocked = ref(false)
let initialSelectionOpened = false

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibility)
  try {
    const history = await props.context.data.history.read()
    funnyUnlocked.value = history.easterEggs.some((item) => item.id === 'funny-album')
    petUnlocked.value = history.easterEggs.some((item) => item.id === 'pet-album')
    history.achievements.forEach(({ id }) => earned.add(id))
    await award(roomDiscoveryAchievements(visited.value, petTaps))
  } catch (error) {
    console.error('读取回忆小屋历史失败', error)
    errorMessage.value = '暂时无法读取历史，仍可探索小屋。'
  } finally {
    readyForCollection.value = true
  }
})
watch([readyForCollection, photos], () => {
  const selection = props.context.collectionSelection
  if (!readyForCollection.value || initialSelectionOpened || !selection) {
    return
  }
  const album = selection.album
  if (selection.puzzle) {
    initialSelectionOpened = true
    resetPuzzle(choices.value[0]?.id ?? null)
    void showPanel('puzzle').then(startClock)
  } else if (album && album !== 'puzzle' && (album !== 'funny' || funnyUnlocked.value)
    && (album !== 'pet' || petUnlocked.value) && photos.value.some((photo) => photo.category === album)) {
    initialSelectionOpened = true
    void openAlbum(album)
  }
})
watch([backgroundReady, photos, panel], async ([ready, items, openPanel], _previous, onCleanup) => {
  if (!ready || openPanel) {
    return
  }

  let cancelled = false
  onCleanup(() => { cancelled = true })

  // 先从墙上相框开始，逐张预取各相册的第一张高清图
  const albumOrder: AlbumCategory[] = [...albums.value, 'pet', 'funny']
  for (const album of albumOrder) {
    if (cancelled) {
      return
    }
    const path = items.find((photo) => photo.category === album)?.image
    if (path && !path.startsWith('data:')) {
      await prefetchImage(import.meta.env.BASE_URL + path)
    }
  }
})

onUnmounted(() => {
  clearInterval(ticker)
  clearTimeout(petTimer)
  document.removeEventListener('visibilitychange', onVisibility)
})

/**
 * 保存当前轮的照片、物件探索和拼图草稿
 *
 * @date 2026/11/24 13:55
 * @param nextPuzzle 可选的下一版拼图状态
 */
function saveDraft(nextPuzzle = puzzle.value) {
  const snapshot = nextPuzzle ? { ...nextPuzzle, tiles: [...nextPuzzle.tiles] } : undefined
  return props.context.data.saveDraft({ explored: [...explored.value], visited: [...visited.value], puzzle: snapshot })
}

/**
 * 打开小屋面板并把焦点移到关闭按钮
 *
 * @date 2026/11/24 11:23
 * @param name 要显示的面板
 */
async function showPanel(name: Panel) {
  if (!panel.value && document.activeElement instanceof HTMLElement) {
    launchedFrom.value = document.activeElement
  }
  panel.value = name
  await nextTick()
  if (dialog.value && !dialog.value.open) {
    if (typeof dialog.value.showModal === 'function') {
      dialog.value.showModal()
    } else {
      dialog.value.setAttribute('open', '')
    }
  }
  panelClose.value?.focus({ preventScroll: true })
}

/**
 * 关闭面板，必要时保存当前拼图时间
 *
 * @date 2026/11/24 11:23
 */
async function closePanel() {
  if (busy.value) {
    return
  }
  if (panel.value === 'puzzle') {
    pauseClock()
    try {
      await saveDraft()
    } catch (error) {
      console.error('保存已暂停拼图失败', error)
      errorMessage.value = '拼图进度还没存好，可以再次打开拼图重试。'
    }
  }
  dialog.value?.close?.()
  panel.value = undefined
  await nextTick()
  launchedFrom.value?.focus({ preventScroll: true })
}

/**
 * 直接点击物件以记录探索，并打开与物件对应的内容
 *
 * @date 2026/11/24 13:55
 * @param id 当前点击的热区
 */
async function explore(id: HotspotId) {
  errorMessage.value = ''
  clearTimeout(petTimer)
  if (id === 'dogs') {
    petTaps += 1
  } else {
    petTaps = 0
  }

  // 点到餐盘也能发现餐桌，后续食物只播放原地反馈
  const food = foodHotspots.find((spot) => spot.id === id)
  const discoverTable = Boolean(food?.meal && !visited.value.includes('daily'))
  const additions: HotspotId[] = discoverTable ? [id, 'daily'] : [id]
  const unvisited = additions.filter((spot) => !visited.value.includes(spot))
  if (unvisited.length) {
    visited.value = [...visited.value, ...unvisited]
    visitedNeedsSave = true
  }
  void recordDiscovery()
  if (food) {
    if (discoverTable) {
      await openAlbum('daily')
    }
    return
  }

  switch (id) {
    case 'puzzle':
      if (!puzzle.value || (!puzzle.value.status && !puzzlePhoto.value && choices.value.length)) {
        resetPuzzle(choices.value[0]?.id ?? null)
      }
      await showPanel('puzzle')
      startClock()
      break
    case 'shelf':
      await showPanel(id)
      break
    case 'dogs':
      // 允许快速连点同一玩偶，停手后再弹出相册
      petTimer = setTimeout(() => { void revealPet() }, 420)
      break
    default:
      if (id === 'couple' || id === 'portrait' || id === 'daily') {
        await openAlbum(id)
      }
  }
}

/**
 * 打开相册并记录第一张照片
 *
 * @date 2026/11/24 11:23
 * @param album 要查看的相册分类
 */
async function openAlbum(album: AlbumCategory) {
  category.value = album
  albumIndex.value = 0
  await showPanel('album')
  await viewPhoto(0)
}

/**
 * 查看真实清单中的一张照片，持久化探索记录
 *
 * @date 2026/11/24 13:55
 * @param index 该相册内的照片位置
 */
async function viewPhoto(index: number) {
  const photo = currentAlbum.value[index]
  if (!photo || busy.value) {
    return
  }
  busy.value = true
  errorMessage.value = ''
  const previous = [...explored.value]
  try {
    await props.context.data.history.remember(photo.id, { explored: true })
    if (albums.value.some((album) => album === category.value) && !explored.value.includes(category.value)) {
      explored.value = [...explored.value, category.value]
      await saveDraft()
    }
    albumIndex.value = index
  } catch (error) {
    console.error('保存相册探索记录失败', error)
    explored.value = previous
    errorMessage.value = '探索记录还没存好，请再打开一次照片。'
  } finally {
    busy.value = false
  }
}

/**
 * 推进隐藏对白并保存首次发现与成就
 *
 * @date 2026/11/24 13:55
 */
async function revealFunny() {
  if (busy.value) {
    return
  }
  if (funnyStep.value === 0) {
    funnyStep.value = 1
    return
  }
  busy.value = true
  try {
    await props.context.data.history.discover('funny-album', props.context.runId)
    await award(['funny-album'])
    funnyUnlocked.value = true
  } catch (error) {
    console.error('保存搞怪相册彩蛋失败', error)
    errorMessage.value = '彩蛋记录还没存好，请再试一次。'
  } finally {
    busy.value = false
  }
  if (funnyUnlocked.value) {
    await openAlbum('funny')
  }
}

/**
 * 为选中的照片创建一局拼图
 *
 * @date 2026/11/24 11:23
 * @param photoId 照片 ID，缺图时传 null
 */
function resetPuzzle(photoId: string | null) {
  pauseClock()
  const runId = props.context.mode === 'story' ? props.context.runId : null
  puzzle.value = {
    id: runId ? 'memory-puzzle:' + runId : newId(),
    photoId, tiles: shuffledTiles(), moves: 0, timeMs: 0,
  }
}

/**
 * 开启前台拼图计时，离开拼图面板时暂停
 *
 * @date 2026/11/24 11:23
 */
function startClock() {
  if (!puzzle.value || puzzle.value.status || !puzzlePhoto.value || startedAt !== undefined || document.hidden) {
    return
  }
  clock.value = Date.now()
  startedAt = clock.value
  ticker = setInterval(() => { clock.value = Date.now() }, 500)
}

/**
 * 停止计时并累计本次活动时间
 *
 * @date 2026/11/24 11:23
 */
function pauseClock() {
  clearInterval(ticker)
  if (puzzle.value && startedAt !== undefined) {
    puzzle.value = { ...puzzle.value, timeMs: puzzle.value.timeMs + Math.max(0, Date.now() - startedAt) }
  }
  startedAt = undefined
}

/**
 * 切后台暂停拼图，返回后只在拼图面板恢复
 *
 * @date 2026/11/24 11:23
 */
async function onVisibility() {
  if (panel.value !== 'puzzle') {
    return
  }
  if (document.hidden) {
    pauseClock()
    if (!busy.value) {
      try {
        await saveDraft()
      } catch (error) {
        console.error('切后台时保存拼图失败', error)
        errorMessage.value = '拼图进度尚未保存。'
      }
    }
  } else {
    startClock()
  }
}

/**
 * 交换两块拼图，归位时提交完成结果
 *
 * @date 2026/11/24 11:23
 * @param first 先选中的位置
 * @param second 后选中的位置
 */
async function swap(first: number, second: number) {
  if (!puzzle.value || busy.value) {
    return
  }
  pauseClock()
  const next = swapTiles(puzzle.value, first, second)
  busy.value = true
  errorMessage.value = ''
  try {
    await saveDraft(next)
    puzzle.value = next
  } catch (error) {
    console.error('保存拼图交换失败', error)
    errorMessage.value = '这次交换还没存好，请重试。'
  } finally {
    busy.value = false
  }
  if (puzzle.value && isSolved(puzzle.value.tiles)) {
    await finishPuzzle('completed')
  } else {
    startClock()
  }
}

/**
 * 保存拼图完成或跳过结果，并仅为实际完成发放成就
 *
 * @date 2026/11/24 13:55
 * @param status 玩家实际完成或选择跳过
 */
async function finishPuzzle(status: 'completed' | 'skipped') {
  if (!puzzle.value || busy.value || puzzle.value.status) {
    return
  }
  pauseClock()
  const current = puzzle.value
  const resultStatus = puzzlePhoto.value && isSolved(current.tiles) ? 'completed' : status
  busy.value = true
  errorMessage.value = ''
  try {
    const result = await props.context.data.history.saveResult({
      id: current.id, kind: 'puzzle', runId: props.context.runId, status: resultStatus,
      timeMs: current.timeMs, moves: current.moves, details: { photoId: current.photoId },
    })
    if (result.status === 'completed' && current.photoId) {
      await props.context.data.history.remember(current.photoId, { explored: true, collected: true })
      await award(['memory-restorer', 'memory-collector'])
    }
    const next = { ...current, status: result.status, moves: result.moves ?? current.moves, timeMs: result.timeMs ?? current.timeMs }
    await saveDraft(next)
    puzzle.value = next
  } catch (error) {
    console.error('保存拼图结算失败', error)
    errorMessage.value = '拼图结果还没存好，请重试。'
  } finally {
    busy.value = false
  }
}

/**
 * 重玩拼图时开启新的独立结果记录
 *
 * @date 2026/11/24 11:23
 * @param event 拼图照片选择框变更事件
 */
function selectPuzzle(event: Event) {
  const select = event.target as HTMLSelectElement
  resetPuzzle(select.value)
  startClock()
}

/**
 * 向主线提交本轮真实的照片与拼图统计
 *
 * @date 2026/11/24 11:23
 */
function completeRoom() {
  if (progress.value.ready) {
    emit('completed', { status: 'completed', statistics: {
      exploredAlbums: albums.value.filter((item) => explored.value.includes(item)),
      puzzleStatus: puzzle.value?.status, puzzlePhotoId: puzzle.value?.photoId,
      puzzleMoves: puzzle.value?.moves, puzzleTimeMs: puzzle.value?.timeMs,
    } })
  }
}

/**
 * 持久化新发现的物件，并检查当次达到的成就
 *
 * @date 2026/11/24 13:55
 */
async function recordDiscovery() {
  const completed = roomDiscoveryAchievements(visited.value, petTaps)
  try {
    if (visitedNeedsSave) {
      const savedVisits = visited.value
      await saveDraft()
      if (savedVisits === visited.value) {
        visitedNeedsSave = false
      }
    }
    await award(completed)
  } catch (error) {
    console.error('保存回忆小屋探索失败', error)
    errorMessage.value = '这次探索还没存好，请再点一下物件。'
  }
}

/**
 * 通过历史事务发放成就，只为首次持久化的记录显示提示
 *
 * @date 2026/11/24 13:55
 * @param ids 达到条件的成就 ID
 */
async function award(ids: readonly AchievementId[]) {
  for (const id of ids) {
    if (!earned.has(id)) {
      const isNew = await props.context.data.history.unlock(id, props.context.runId)
      earned.add(id)
      if (isNew) {
        notify(id)
      }
    }
  }
}

/**
 * 打开玩偶后的宠物相册，并记录隐藏内容首次触发
 *
 * @date 2026/11/24 13:55
 */
async function revealPet() {
  await openAlbum('pet')
  try {
    await props.context.data.history.discover('pet-album', props.context.runId)
    await award(['pet-discovery'])
  } catch (error) {
    console.error('保存狗狗秘密相册发现失败', error)
    errorMessage.value = '秘密相册的发现记录还没存好，请再试一次。'
  }
}

/**
 * 从玩偶区进入原有搞怪相册和彩蛋对白
 *
 * @date 2026/11/24 13:55
 */
async function openFunny() {
  if (funnyUnlocked.value) {
    await openAlbum('funny')
  } else {
    funnyStep.value = 0
    await showPanel('funny')
  }
}
</script>

<template>
  <section class="memory-room">
    <RoomPageFrame :controls="roomControls" :found="foundMemories" :total="mainMemoryPoints.length">
      <RoomArt @explore="explore" @background-ready="backgroundReady = true" />
      <template #actions>
        <p v-if="errorMessage && !panel" role="alert">{{ errorMessage }}</p>
        <button v-if="context.mode !== 'collection' && progress.ready" class="primary" type="button"
          @click="showPanel('transition')">继续冒险</button>
      </template>
    </RoomPageFrame>

    <dialog v-if="panel" ref="dialog" class="panel" :class="{ 'photo-panel': panel === 'album' }"
      :aria-label="panel === 'album' ? undefined : '回忆小屋互动'"
      :aria-labelledby="panel === 'album' ? 'memory-album-title' : undefined"
      @cancel.prevent="closePanel" @keydown.esc.prevent="closePanel">
      <template v-if="panel !== 'album'">
        <button ref="panelClose" type="button" class="secondary close" :disabled="busy" @click="closePanel">返回小屋</button>
        <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
      </template>

      <template v-if="panel === 'album'">
        <AlbumViewer :category="category" :photos="currentAlbum" :index="albumIndex" @change="viewPhoto">
          <template #close>
            <button ref="panelClose" type="button" class="album-close" :disabled="busy" aria-label="关闭相册，返回小屋" @click="closePanel">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </template>
          <template #status>
            <p v-if="errorMessage" class="album-alert" role="alert">{{ errorMessage }}</p>
          </template>
          <template v-if="category === 'pet'" #default>
            <p class="album-aside">{{ personal.sender }}：汪！小白和我在这里藏了一本相册。</p>
            <button class="secret-tab" type="button" :disabled="busy" @click="openFunny">看看另一份小秘密</button>
          </template>
        </AlbumViewer>
      </template>
      <template v-else-if="panel === 'shelf'">
        <h2>特别回忆</h2>
        <p v-if="!shelfAlbums.length">书架上的相册还空着。</p>
        <div class="choices">
          <button v-for="album in shelfAlbums" :key="album" class="secondary" type="button" @click="openAlbum(album)">{{ albumTitles[album] }}</button>
        </div>
      </template>
      <template v-else-if="panel === 'puzzle'">
        <label v-if="context.mode !== 'story' && choices.length > 1" class="photo-choice">拼图照片
          <select class="secondary" :value="puzzle?.photoId" :disabled="busy" @change="selectPuzzle">
            <option v-for="(photo, index) in choices" :key="photo.id" :value="photo.id">{{ photo.title || '照片 ' + (index + 1) }}</option>
          </select>
        </label>
        <PuzzleBoard :key="puzzle?.id" :puzzle="puzzle" :photo="puzzlePhoto" :busy="busy" :elapsed="elapsed" @swap="swap" @finish="finishPuzzle" />
        <button v-if="puzzle && !puzzle.status && puzzlePhoto && isSolved(puzzle.tiles)" type="button" class="secondary"
          :disabled="busy" @click="finishPuzzle('completed')">保存拼图结果</button>
        <button v-if="context.mode === 'collection' && puzzle?.status && puzzlePhoto" type="button" class="secondary"
          @click="resetPuzzle(puzzlePhoto.id); startClock()">再拼一次</button>
      </template>
      <template v-else-if="panel === 'funny'">
        <h2>小金毛的小秘密</h2>
        <p aria-live="polite">{{ dialogue.hiddenAlbum[funnyStep * 2] }}</p>
        <button class="secondary" type="button" :disabled="busy" @click="revealFunny">{{ dialogue.hiddenAlbum[funnyStep * 2 + 1] }}</button>
      </template>
      <template v-else-if="panel === 'transition'">
        <p>{{ dialogue.transitions.memory }}</p>
        <button class="primary" type="button" @click="completeRoom">去花店</button>
      </template>
    </dialog>
    <AchievementToast :achievement="newAchievement" :container="dialog" />
  </section>
</template>

<style scoped>
.memory-room { max-width: 36rem; margin-inline: auto; }
h2 { margin: .25rem 0 .55rem; }
p { margin: .5rem 0; }
.panel { position: fixed; inset: 0; margin: auto; width: min(calc(100% - 1.5rem), 34rem); max-height: 85vh; max-height: 85dvh; overflow: auto; padding: 1rem; color: var(--ink); background: #fffdf8; border: 2px solid var(--ink); border-radius: 1.05rem; }
.panel::backdrop { background: #403a3466; }
.panel.photo-panel {
  width: min(100%, 42rem); height: 100vh; height: 100dvh; max-height: none; max-width: 100%;
  padding: 0; border: 0; border-radius: 0; background: transparent; overflow-x: hidden; overscroll-behavior: contain;
}
:global(html:has(.photo-panel[open])) { overflow: hidden; }
.photo-panel::backdrop {
  background: linear-gradient(180deg, #4831259c, #65452c2e 24%, #4e322e58 65%, #493227ad);
}
.album-close {
  position: absolute; top: 0; right: .25rem; display: grid; place-items: center; width: 44px; padding: 0;
  border: 1px solid #f0d8bb; border-radius: 50%; background: #fff7e9f2; color: #684637;
  box-shadow: 0 .13rem .45rem #39201238;
}
.album-close svg { width: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
.album-alert, .album-aside { margin: .3rem auto 0; padding: .2rem .5rem; border-radius: .45rem; text-align: center; background: #fff8eded; font-size: .76rem; }
.secret-tab { position: relative; isolation: isolate; padding: 0 .6rem; border: 0; color: #4f402d; background: transparent; text-decoration: underline; text-underline-offset: .24em; font-size: .8rem; }
.secret-tab::before { content: ''; position: absolute; inset: .3rem 0; border-radius: .3rem; background: #fff4d5ec; z-index: -1; }
.close { margin-bottom: .7rem; }
.choices { display: flex; flex-wrap: wrap; gap: .5rem; }
.photo-choice { display: flex; align-items: center; flex-wrap: wrap; gap: .45rem; }
.primary { background: var(--ink); color: var(--white); border: 1px solid var(--ink); border-radius: .85rem; padding: .55rem .9rem; font-weight: 750; }
</style>

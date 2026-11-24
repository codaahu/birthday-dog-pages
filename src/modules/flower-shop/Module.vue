<script setup lang="ts">
import { computed, nextTick, onMounted, ref, toRaw } from 'vue'
import { dialogue } from '../../config/dialogue'
import type { ModuleCompletion } from '../../core/story/contract'
import { newId } from '../../core/storage/id'
import type { Work } from '../../core/storage/types'
import ArtworkExport from '../../shared/studio/ArtworkExport.vue'
import { useDesignDraft } from '../../shared/studio/useDesignDraft'
import type { ArtworkPoint } from '../../shared/studio/useArtworkDrag'
import BouquetArtwork from './BouquetArtwork.vue'
import FlowerBloom from './FlowerBloom.vue'
import FlowerCounter from './FlowerCounter.vue'
import { addStem, bouquetList, bouquetOrder, isPackable, newBouquet, stemPosition } from './bouquet'
import { cardLength, cardMessages, flowerMaterials, flowerNotes, maxStems, minStems, papers, ribbons } from './config'
import type { Bouquet, FlowerKind, ModuleProps } from './types'

const props = defineProps<ModuleProps>()
const emit = defineEmits<{ completed: [result: ModuleCompletion] }>()
const { design, undoStack, saveError, checkpoint, edit, undo, replace } = useDesignDraft(
  toRaw(props.context.draft?.design as Bouquet | undefined) ?? newBouquet(),
  (draft) => props.context.data.saveDraft(draft),
  (bouquet) => ({ design: bouquet }),
)
const art = ref<InstanceType<typeof BouquetArtwork>>()
const stage = ref<HTMLDivElement>()
const kind = ref<FlowerKind>('tulip')
const color = ref(0)
const selected = ref<string>()
const currentStem = computed(() => design.value.stems.find((stem) => stem.id === selected.value))
const work = ref<Work>()
const selection = props.context.collectionSelection?.workId
const busy = ref(Boolean(props.context.draft?.design || selection))
const packedHere = ref(false)
const showTransition = ref(false)
const errorMessage = ref('')
const copyState = ref<'copied' | 'manual'>()
const listText = ref<HTMLTextAreaElement>()
const order = computed(() => work.value
  ? (work.value.snapshot.order as ReturnType<typeof bouquetOrder> | undefined) ?? bouquetOrder(design.value) : undefined)
const materialsList = computed(() => bouquetList(design.value))
const comment = ref('挑一枝你喜欢的花吧。')
const displayNote = computed(() => work.value ? '为今天过生日的人，包好了一束花。' : comment.value)
const wrapping = ref(false)
const counterMood = computed(() => {
  if (wrapping.value) {
    return 'wrap'
  }
  if (work.value) {
    return 'gift'
  }
  return design.value.stems.length ? 'arrange' : 'browse'
})

onMounted(async () => {
  if (!busy.value) {
    return
  }
  try {
    const existing = await props.context.data.history.getWork(selection ?? design.value.id)
    if (existing?.kind === 'bouquet' && Array.isArray((existing.snapshot.design as Bouquet | undefined)?.stems)) {
      useSaved(existing)
    } else if (selection) {
      errorMessage.value = '这束花的设计快照暂时无法恢复。'
    }
  } catch (error) {
    console.error('恢复已包装花束失败', error)
    errorMessage.value = '暂时无法确认保存状态，重新包装时会沿用同一个订单。'
  } finally {
    busy.value = false
  }
})

/** 选择一种花材，颜色默认选第一款
 * @date 2026/11/24 11:51
 * @param next 花材配置 ID
 */
function pickFlower(next: FlowerKind) {
  kind.value = next
  color.value = 0
}

/** 添加一枝所选花材并选中做微调
 * @date 2026/11/24 11:51
 */
function addFlower() {
  const next = addStem(design.value, kind.value, color.value)
  if (next !== design.value) {
    selected.value = next.stems[next.stems.length - 1].id
    comment.value = kind.value in flowerNotes ? flowerNotes[kind.value as keyof typeof flowerNotes] : '给这枝花留了个好位置。'
    edit(next)
  }
}

/** 更新指定花枝的位置
 * @date 2026/11/24 11:51
 * @param id 要移动的花枝
 * @param point 画布上的目标坐标
 */
function moveStem(id: string, point: ArtworkPoint) {
  const position = stemPosition(point)
  edit({ ...design.value, stems: design.value.stems.map((stem) => stem.id === id ? { ...stem, ...position } : stem) })
}

/** 用方向按钮微调选中花枝
 * @date 2026/11/24 11:51
 * @param dx 横向偏移
 * @param dy 纵向偏移
 */
function nudge(dx: number, dy: number) {
  if (currentStem.value) {
    moveStem(currentStem.value.id, { x: currentStem.value.x + dx, y: currentStem.value.y + dy })
  }
}

/** 删除当前选中的花枝
 * @date 2026/11/24 11:51
 */
function removeStem() {
  edit({ ...design.value, stems: design.value.stems.filter((stem) => stem.id !== selected.value) })
  selected.value = undefined
}

/** 用持久化成品替换草稿，展示订单与导出操作
 * @date 2026/11/24 11:51
 * @param saved 已经持久化的花束记录
 */
function useSaved(saved: Work) {
  replace(saved.snapshot.design as Bouquet)
  work.value = saved
  selected.value = undefined
}

/** 保存花束、虚拟订单和成就，保存后在工作台播放包装动画
 * @date 2026/11/24 15:25
 */
async function wrap() {
  if (busy.value || work.value || !isPackable(design.value)) {
    return
  }
  busy.value = true
  wrapping.value = true
  errorMessage.value = ''
  try {
    await checkpoint()
    const bouquet = design.value
    const saved = await props.context.data.history.saveWork({
      id: bouquet.id, kind: 'bouquet', runId: props.context.runId,
      snapshot: { version: 1, design: bouquet, order: bouquetOrder(bouquet) },
    }, 'florist')
    useSaved(saved)
    packedHere.value = true
    // 从底部工作区发起包装时，把花束带回手机可视区域
    await nextTick()
    stage.value?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  } catch (error) {
    console.error('保存花束和订单失败', error)
    errorMessage.value = '这束花还没存好，请再包装一次。'
    wrapping.value = false
  } finally {
    busy.value = false
  }
}

/** 尝试复制花材清单，失败时打开可长按选择的文本
 * @date 2026/11/24 11:51
 */
async function copyList() {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(materialsList.value)
      copyState.value = 'copied'
      return
    } catch (error) {
      console.error('复制花材清单失败', error)
    }
  }
  copyState.value = 'manual'
  await nextTick()
  listText.value?.focus()
  listText.value?.select()
}

/** 开始一件独立新作品，保留前一件花束
 * @date 2026/11/24 15:25
 */
function startNew(copy = false) {
  replace(copy ? { ...design.value, id: newId() } : newBouquet())
  work.value = undefined
  packedHere.value = false
  wrapping.value = false
  showTransition.value = false
  copyState.value = undefined
  comment.value = '挑一枝你喜欢的花吧。'
  void checkpoint()
}

/** 告知主控已经完成一束花
 * @date 2026/11/24 11:51
 */
function finish() {
  if (work.value) {
    emit('completed', { status: 'completed', statistics: { workId: work.value.id, stems: design.value.stems.length } })
  }
}
</script>

<template>
  <section class="flower-page">
    <header class="flower-head">
      <p class="chapter-tag">CHAPTER 02 <span aria-hidden="true">·</span> 小狗花店</p>
      <h1>今天的花花，免费送给你</h1>
      <svg viewBox="0 0 212 18" aria-hidden="true">
        <path d="M17 13Q70 1 104 8q43 7 90-2m-107 7q7-1 15-2" />
      </svg>
    </header>

    <div ref="stage" class="workbench">
      <FlowerCounter :mood="counterMood" :note="displayNote" :wrapped="packedHere" @wrap-shown="wrapping = false">
        <BouquetArtwork ref="art" :bouquet="design" :selected="selected" :editing="!work && !busy" :packaged="Boolean(work)"
          @select="selected = $event" @move="moveStem" />
      </FlowerCounter>
    </div>

    <template v-if="!work">
      <div class="worktable">
        <fieldset :disabled="busy" class="flower-tools">
          <legend class="sr-only">挑选花材</legend>
          <div class="section-heading">
            <h2>挑一挑花材</h2>
            <p class="stem-count" aria-live="polite"><strong>{{ design.stems.length }}</strong> / {{ maxStems }} 枝</p>
          </div>
          <div class="stem-tray">
            <button v-for="(item, key) in flowerMaterials" :key="key" class="flower-label" type="button"
              :aria-pressed="kind === key" @click="pickFlower(key)">
              <svg viewBox="-30 -28 60 70" aria-hidden="true">
                <path d="M0 8q3 14 0 29M1 28q-6-11-14-9 3 9 14 9m0 3q8-11 15-8-4 9-15 8" fill="#a9bd96" stroke="#69816a" stroke-width="2" stroke-linecap="round" />
                <FlowerBloom :kind="key" :color="kind === key ? item.colors[color] : item.colors[0]" />
              </svg>
              <span>{{ item.name }}</span>
            </button>
          </div>
          <div class="petal-picker">
            <div class="swatches" :aria-label="flowerMaterials[kind].name + '配色'" role="group">
              <button v-for="(swatch, index) in flowerMaterials[kind].colors" :key="swatch" type="button" class="swatch"
                :style="{ '--swatch': swatch }" :aria-label="'花瓣颜色 ' + (index + 1)" :aria-pressed="color === index"
                @click="color = index"></button>
            </div>
            <button class="add-flower" type="button" :disabled="design.stems.length >= maxStems" @click="addFlower">
              <span aria-hidden="true">＋</span> 添加{{ flowerMaterials[kind].name }}
            </button>
          </div>
        </fieldset>

        <fieldset :disabled="busy" class="wrapping-tools">
          <legend class="sr-only">包装和丝带</legend>
          <div class="material-pick">
            <h2>包装纸</h2>
            <div class="swatches" role="group" aria-label="包装纸">
              <button v-for="(paper, key) in papers" :key="key" type="button" class="swatch paper-swatch"
                :style="{ '--swatch': paper.color }" :aria-label="paper.name + '包装纸'" :aria-pressed="design.paper === key"
                @click="edit({ ...design, paper: key })"></button>
            </div>
          </div>
          <div class="material-pick">
            <h2>丝带</h2>
            <div class="swatches" role="group" aria-label="丝带">
              <button v-for="(ribbon, key) in ribbons" :key="key" type="button" class="swatch ribbon-swatch"
                :style="{ '--swatch': ribbon.color }" :aria-label="ribbon.name + '丝带'" :aria-pressed="design.ribbon === key"
                @click="edit({ ...design, ribbon: key })"></button>
            </div>
          </div>
        </fieldset>

        <details v-if="design.stems.length" class="fold-notebook">
          <summary>微调花枝</summary>
          <fieldset :disabled="busy">
            <legend class="sr-only">选择要微调的花枝</legend>
            <div class="stem-choices">
              <button v-for="(stem, index) in design.stems" :key="stem.id" type="button" class="stem-edit"
                :aria-label="'第 ' + (index + 1) + ' 枝' + flowerMaterials[stem.kind].name"
                :aria-pressed="selected === stem.id" @click="selected = stem.id">
                <span aria-hidden="true" :style="{ '--swatch': flowerMaterials[stem.kind].colors[stem.color] }"></span>{{ index + 1 }}
              </button>
            </div>
            <div v-if="currentStem" class="nudge-tools">
              <button type="button" aria-label="左移" @click="nudge(-8, 0)">←</button>
              <button type="button" aria-label="右移" @click="nudge(8, 0)">→</button>
              <button type="button" aria-label="上移" @click="nudge(0, -8)">↑</button>
              <button type="button" aria-label="下移" @click="nudge(0, 8)">↓</button>
              <button type="button" @click="removeStem">删除这枝</button>
            </div>
          </fieldset>
        </details>

        <details class="fold-notebook">
          <summary>写一张贺卡</summary>
          <fieldset :disabled="busy">
            <legend class="sr-only">贺卡留言</legend>
            <div class="card-stickers">
              <button v-for="message in cardMessages" :key="message" type="button" :aria-pressed="design.message === message"
                @click="edit({ ...design, message })">{{ message }}</button>
            </div>
            <label class="sr-only" for="flower-message">贺卡留言</label>
            <textarea id="flower-message" :value="design.message" rows="2" :maxlength="cardLength"
              @input="edit({ ...design, message: ($event.target as HTMLTextAreaElement).value })"></textarea>
          </fieldset>
        </details>
      </div>

      <p v-if="errorMessage || saveError" class="flower-alert" role="alert">{{ errorMessage || '草稿还没写入，下一次修改时会重试。' }}</p>
      <footer class="wrap-dock">
        <div class="undo-line">
          <button type="button" :disabled="busy || !undoStack.length" @click="undo">撤销</button>
          <button type="button" :disabled="busy || !design.stems.length"
            @click="edit({ ...design, stems: [] }); selected = undefined">重新搭配</button>
        </div>
        <button type="button" class="flower-primary" :disabled="busy || !isPackable(design)" @click="wrap">
          {{ wrapping ? '正在包装…' : '包装花束' }}<small v-if="!busy && design.stems.length < minStems">至少 {{ minStems }} 枝</small>
        </button>
      </footer>
    </template>

    <template v-else-if="order">
      <article class="receipt">
        <header><h2>小狗花店订单</h2><p class="number">{{ order.number }}</p></header>
        <dl>
          <div><dt>收件人</dt><dd>{{ order.recipient }}</dd></div>
          <div><dt>花束</dt><dd>{{ order.item }}</dd></div>
          <div><dt>合计</dt><dd>{{ order.total }}</dd></div>
          <div><dt>配送</dt><dd>{{ order.delivery }}</dd></div>
          <div><dt>支付</dt><dd>{{ order.payment }}</dd></div>
        </dl>
        <strong class="receipt-stamp">{{ order.status }}</strong>
        <p class="order-note">虚拟订单，可作为现实搭配参考。</p>
      </article>
      <div class="result-tools">
        <ArtworkExport :key="work.id" :artwork="() => art?.artwork" :filename="order.number" />
        <button type="button" class="secondary" @click="copyList">复制花材清单</button>
        <button v-if="context.mode !== 'story'" type="button" class="secondary" @click="startNew()">另做一束</button>
        <button v-if="context.mode !== 'story'" type="button" class="secondary" @click="startNew(true)">另存副本</button>
      </div>
      <p v-if="copyState === 'copied'" class="flower-alert" role="status">花材清单已复制。</p>
      <label v-if="copyState === 'manual'" class="manual-copy">长按复制花材清单
        <textarea ref="listText" :value="materialsList" readonly rows="5"></textarea>
      </label>
      <div v-if="context.mode !== 'collection' && !context.collectionSelection" class="after-wrap">
        <button v-if="!showTransition" type="button" class="flower-primary" @click="showTransition = true">继续冒险</button>
        <template v-else>
          <p>{{ dialogue.transitions.flower }}</p>
          <button type="button" class="flower-primary" @click="finish">去蛋糕屋</button>
        </template>
      </div>
    </template>
  </section>
</template>

<style scoped>
.flower-page {
  --flower-ink: #553c31;
  --leaf: #4e6d53;
  --bark: #ab795c;
  --hand: 'Kaiti SC', STKaiti, KaiTi, '楷体', serif;
  max-width: 34rem;
  margin-inline: auto;
  padding: .7rem 0 max(.65rem, env(safe-area-inset-bottom));
  color: var(--flower-ink);
  background: radial-gradient(ellipse at 82% 14%, #e7eddb 0%, transparent 35%),
    radial-gradient(ellipse at 9% 55%, #f8e5dc 0%, transparent 34%), #fff9ed;
}
.flower-head { position: relative; text-align: center; padding: .7rem .2rem .9rem; }
.chapter-tag { display: flex; align-items: center; justify-content: center; gap: .43em; margin: 0 0 .6rem; color: var(--leaf); font-size: .74rem; font-weight: 750; letter-spacing: .13em; }
.chapter-tag::before, .chapter-tag::after { content: ''; width: clamp(.7rem, 5vw, 1.5rem); height: 1px; background: #b29c72; }
.flower-head h1 { margin: 0; color: var(--flower-ink); font: 720 clamp(1.26rem, 6.4vw, 2.22rem)/1.24 var(--hand); letter-spacing: -.055em; transform: rotate(-1deg); text-shadow: .024em .024em currentColor; }
.flower-head svg { display: block; width: 47%; height: .78rem; margin: .2rem auto 0; fill: none; stroke: #dba692; stroke-width: 3; stroke-linecap: round; }
.workbench { margin-inline: -.3rem; scroll-margin-block-start: max(.45rem, env(safe-area-inset-top)); }
.worktable { padding: .75rem .17rem 0; }
fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
.section-heading { display: flex; justify-content: space-between; align-items: baseline; padding-inline: .18rem; margin-bottom: .36rem; }
.section-heading h2, .material-pick h2 { color: var(--leaf); font: 750 1.1rem/1.3 var(--hand); margin: 0; }
.stem-count { margin: 0; color: #775747; font-size: .79rem; font-variant-numeric: tabular-nums; }
.stem-count strong { color: var(--leaf); font-size: 1.15em; }
.stem-tray { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .35rem; }
.flower-label { display: grid; justify-items: center; align-content: center; row-gap: .06rem; min-width: 0; min-height: 62px; padding: .13rem .02rem .22rem; border: 1px solid #d9cdb2; border-radius: .62rem .69rem .55rem .7rem; background: #fffaf0; color: var(--flower-ink); font: 700 clamp(.73rem, 3.25vw, .96rem)/1.2 var(--hand); }
.flower-label svg { display: block; width: 2rem; height: 2.18rem; }
.flower-label[aria-pressed=true] { border-color: #658268; background: #edf1df; box-shadow: inset 0 0 0 1px #9bae87; }
.petal-picker, .material-pick { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .22rem .32rem; }
.petal-picker { margin-top: .35rem; }
.swatches { display: flex; flex-wrap: wrap; align-items: center; gap: .02rem; }
.swatch { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; }
.swatch::before { content: ''; width: 29px; height: 29px; background: var(--swatch); border: 1px solid #7359438c; border-radius: 49% 51% 50% 50%; box-shadow: inset 0 0 0 2px #fff4df63; }
.swatch[aria-pressed=true]::before { outline: 1.5px solid #526e54; outline-offset: 3px; }
.paper-swatch::before { border-radius: 17% 21% 16% 23%; }
.ribbon-swatch::before { background: linear-gradient(135deg, #fff8e780, transparent 50%), var(--swatch); }
.add-flower { border: 1px solid #738364; border-radius: 2rem; padding: .18rem .62rem; background: #e2ead1; color: #415d43; font-weight: 750; font-size: .8rem; }
.add-flower span { color: #6f8a6c; }
.wrapping-tools { display: grid; gap: .06rem; margin-top: .4rem; padding-block: .3rem; border-block: 1px dashed #c6b399; }
.material-pick { padding-inline: .22rem; }
.fold-notebook { margin: .22rem 0; border-bottom: 1px solid #ded1b7; }
.fold-notebook summary { padding: .63rem .3rem; cursor: pointer; font: 750 1rem/1.4 var(--hand); color: var(--leaf); }
.fold-notebook fieldset { padding: .15rem .1rem .55rem; }
.stem-choices, .nudge-tools, .card-stickers { display: flex; flex-wrap: wrap; gap: .17rem; }
.stem-edit, .nudge-tools button, .card-stickers button { border: 1px solid #cdbb9e; background: #fff7e8; border-radius: .65rem; min-width: 44px; color: var(--flower-ink); font: inherit; font-size: .77rem; padding: .25rem .43rem; }
.stem-edit span { display: inline-block; width: .62rem; height: .62rem; margin-right: .15rem; border-radius: 50%; background: var(--swatch); border: 1px solid #ab897a; }
.stem-edit[aria-pressed=true], .card-stickers button[aria-pressed=true] { border-color: #628363; background: #ebefda; }
.nudge-tools { margin-top: .2rem; }
.flower-page textarea { display: block; width: 100%; margin: .4rem 0 0; padding: .42rem .62rem; border: 1px solid #cab28e; border-radius: .65rem; background: #fffdf2; color: inherit; font: inherit; font-size: 1rem; resize: vertical; }
.wrap-dock { position: sticky; bottom: 0; z-index: 5; display: grid; gap: .05rem; padding: .2rem .2rem max(.35rem, env(safe-area-inset-bottom)); background: linear-gradient(180deg, #fff8eaec, #fff8ea 25%); border-top: 1px solid #e9d7bd; }
.undo-line { display: flex; justify-content: center; gap: 1rem; }
.undo-line button { padding: 0 .32rem; border: 0; background: transparent; color: #755444; text-decoration: underline; text-underline-offset: .2em; font: 700 .87rem/1.4 var(--hand); }
.flower-primary { min-height: 48px; width: 100%; padding: .38rem .6rem; border: 1.5px solid #8c6f50; border-radius: 1.7rem; color: #543c2c; background: #f5dca2; box-shadow: 0 2px #aa805545, inset 0 1px #ffedc4; text-align: center; font: 750 1.05rem/1.2 var(--hand); }
.flower-primary small { margin-inline-start: .5rem; font: 650 .7rem/1.1 sans-serif; }
.flower-primary:disabled { cursor: default; box-shadow: none; }
.flower-alert { margin: .6rem .25rem; font-size: .86rem; }
.receipt { position: relative; margin: 1.05rem auto .72rem; padding: .77rem 1.04rem .65rem; background: #fffdf2; box-shadow: .18rem .24rem #d4b48a76; border: 1px solid #e4cba9; border-radius: .4rem .55rem .37rem .63rem; max-width: 28rem; }
.receipt::before { content: ''; position: absolute; top: -.35rem; left: calc(50% - 1.8rem); width: 3.6rem; height: .78rem; background: #e9b4adad; transform: rotate(-5deg); }
.receipt header { text-align: center; border-bottom: 1px dashed #cbab86; padding-bottom: .33rem; }
.receipt h2 { margin: 0; font: 750 1.2rem/1.35 var(--hand); }
.number { font-variant-numeric: tabular-nums; overflow-wrap: anywhere; margin: .13rem 0 0; color: #755c45; font-size: .72rem; }
.receipt dl { margin: .38rem 0; font-size: .84rem; }
.receipt dl div { display: flex; justify-content: space-between; gap: .7rem; padding-block: .26rem; }
.receipt dd { margin: 0; text-align: right; }
.receipt-stamp { display: inline-block; margin: .35rem 0 0; padding: .13rem .38rem; color: #95595a; border: 1px double currentColor; border-radius: 22% 13% 14% 17%; transform: rotate(-3deg); font-size: .77rem; }
.order-note { margin: .25rem 0 0; color: #755c45; font-size: .74rem; }
.result-tools { display: flex; flex-wrap: wrap; justify-content: center; gap: .35rem; padding-inline: .1rem; }
.result-tools :deep(.secondary) { color: #526652; background: #f6f5e7; border: 1px solid #b6bd9e; font-size: .82rem; border-radius: 1.2rem; }
.result-tools :deep(.download) { width: 100%; text-align: center; }
.result-tools :deep(.download img) { margin-inline: auto; background: #fff8e9; }
.manual-copy { display: block; margin: .4rem 0; }
.after-wrap { margin-top: .63rem; text-align: center; }
.after-wrap p { max-width: 21rem; margin: .5rem auto; font: 750 1.04rem/1.5 var(--hand); }
</style>

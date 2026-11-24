<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, toRaw } from 'vue'
import { assets } from '../../config/assets'
import { dialogue } from '../../config/dialogue'
import type { ModuleCompletion } from '../../core/story/contract'
import { newId } from '../../core/storage/id'
import type { Work } from '../../core/storage/types'
import ArtworkExport from '../../shared/studio/ArtworkExport.vue'
import { useDesignDraft } from '../../shared/studio/useDesignDraft'
import type { ArtworkPoint } from '../../shared/studio/useArtworkDrag'
import CakeArtwork from './CakeArtwork.vue'
import CakePiece from './CakePiece.vue'
import CakeScene from './CakeScene.vue'
import { addPiece, candleDigits, canInsert, changePiece, newCake, resumePhase } from './cake'
import { creams, maxPieces, pieceNames, scaleMax, scaleMin, spongeKinds, wishCopy } from './config'
import type { Cake, CakePhase, ModuleProps, Piece, PieceKind } from './types'
import { useBlowDetector } from './useBlowDetector'

const props = defineProps<ModuleProps>()
const emit = defineEmits<{ completed: [result: ModuleCompletion] }>()
const phase = ref<CakePhase>(resumePhase(props.context.draft?.phase))
const { design, undoStack, saveError, checkpoint, edit, undo, replace } = useDesignDraft(
  toRaw(props.context.draft?.design as Cake | undefined) ?? newCake(),
  (draft) => props.context.data.saveDraft(draft),
  (cake) => ({ design: cake, phase: phase.value }),
)
const selected = ref<string>()
const currentPiece = computed(() => design.value.pieces.find((piece) => piece.id === selected.value))
const temporaryAdjustment = ref<{ id: string; values: Partial<Pick<Piece, 'angle' | 'scale'>> }>()
const previewDesign = computed(() => {
  const adjustment = temporaryAdjustment.value
  return adjustment ? changePiece(design.value, adjustment.id, adjustment.values) : design.value
})
const work = ref<Work>()
const art = ref<InstanceType<typeof CakeArtwork>>()
const stage = ref<HTMLDivElement>()
const selection = props.context.collectionSelection?.workId
const busy = ref(Boolean(props.context.draft?.design || selection))
const errorMessage = ref('')
const showTransition = ref(false)
const celebrating = ref(false)
const microphone = useBlowDetector(() => { void blow() })
const topper = assets.dogs.golden['cake-topper'] ?? assets.dogs.golden.happy
const dogArtwork = topper
  ? import.meta.env.BASE_URL + topper
  : import.meta.env.DEV && props.context.mode === 'dev' ? import.meta.env.BASE_URL + '__birthday_dev_cake/golden-cheer.png' : undefined
// 标题随制作、插蜡烛、许愿和完成的现有步骤切换
const phaseTitles: Record<CakePhase, string> = {
  editing: '今天的蛋糕，你说了算！',
  served: '蛋糕端上来啦',
  candles: '要点蜡烛啦',
  wish: wishCopy.title,
  finished: '生日快乐！',
}
let celebrationTimer: ReturnType<typeof setTimeout> | undefined

onMounted(async () => {
  if (!busy.value) {
    return
  }
  try {
    const existing = await props.context.data.history.getWork(selection ?? design.value.id)
    if (existing?.kind === 'cake' && Array.isArray((existing.snapshot.design as Cake | undefined)?.pieces)) {
      useSaved(existing)
    } else if (selection) {
      errorMessage.value = '这个蛋糕的设计快照暂时无法恢复。'
    }
  } catch (error) {
    console.error('恢复已保存蛋糕失败', error)
    errorMessage.value = '暂时无法确认保存状态，再次吹灭时会沿用同一件作品。'
  } finally {
    busy.value = false
  }
})

onUnmounted(() => clearTimeout(celebrationTimer))

/** 添加一件水果或装饰并设为当前选中项
 * @date 2026/11/24 11:51
 * @param kind 要放上蛋糕的装饰类型
 */
function place(kind: PieceKind) {
  const next = addPiece(design.value, kind)
  if (next !== design.value) {
    selected.value = next.pieces[next.pieces.length - 1].id
    edit(next)
  }
}

/** 更新被选中装饰的位置、角度或大小
 * @date 2026/11/24 11:51
 * @param values 要修改的装饰属性
 */
function adjust(values: Partial<Pick<Piece, 'x' | 'y' | 'angle' | 'scale'>>) {
  if (currentPiece.value) {
    edit(changePiece(design.value, currentPiece.value.id, values))
  }
}

/** 拖动滑杆时即时预览，松手后只记一次撤销
 * @date 2026/11/24 11:55
 * @param event 滑杆的输入或提交事件
 * @param field 本次修改旋转角度或缩放比例
 */
function slide(event: Event, field: 'angle' | 'scale') {
  if (!currentPiece.value) {
    return
  }
  const values = { [field]: (event.target as HTMLInputElement).valueAsNumber }
  if (event.type === 'change') {
    temporaryAdjustment.value = undefined
    adjust(values)
  } else {
    temporaryAdjustment.value = { id: currentPiece.value.id, values }
  }
}

/** 保存指针拖动结束时的装饰坐标
 * @date 2026/11/24 11:51
 * @param id 拖动的装饰 ID
 * @param point 拖动完成的目标坐标
 */
function movePiece(id: string, point: ArtworkPoint) {
  edit(changePiece(design.value, id, point))
}

/** 使用方向键按钮微调装饰摆放
 * @date 2026/11/24 11:51
 * @param x 横向位移
 * @param y 纵向位移
 */
function nudge(x: number, y: number) {
  if (currentPiece.value) {
    adjust({ x: currentPiece.value.x + x, y: currentPiece.value.y + y })
  }
}

/** 移除选中的装饰
 * @date 2026/11/24 11:51
 */
function removePiece() {
  edit({ ...design.value, pieces: design.value.pieces.filter((piece) => piece.id !== selected.value) })
  selected.value = undefined
}

/** 保存下一阶段并将蛋糕留在可视区，失败时停留在原步骤
 * @date 2026/11/24 15:46
 * @param next 合法的下一阶段
 */
async function go(next: CakePhase) {
  if (busy.value || (next === 'candles' && !canInsert(design.value.candle))) {
    return
  }
  busy.value = true
  errorMessage.value = ''
  const previous = phase.value
  phase.value = next
  try {
    await checkpoint()
    // 主操作在下方时，切换阶段后把主场景带回可视区域
    await nextTick()
    stage.value?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  } catch (error) {
    console.error('保存蛋糕流程失败', error)
    phase.value = previous
    errorMessage.value = '这一步还没存好，请再试一次。'
  } finally {
    busy.value = false
  }
}

/** 恢复持久化成品及其完成态
 * @date 2026/11/24 11:51
 * @param saved 已保存的蛋糕快照
 */
function useSaved(saved: Work) {
  replace(saved.snapshot.design as Cake)
  work.value = saved
  phase.value = 'finished'
  selected.value = undefined
}

/** 吹灭蜡烛并首次保存蛋糕，再次吹灭时沿用已有作品
 * @date 2026/11/24 11:51
 */
async function blow() {
  if (phase.value !== 'wish' || busy.value) {
    return
  }
  microphone.stop()
  busy.value = true
  errorMessage.value = ''
  try {
    if (!work.value) {
      await checkpoint()
      const cake = design.value
      const saved = await props.context.data.history.saveWork({
        id: cake.id, kind: 'cake', runId: props.context.runId, snapshot: { version: 1, design: cake },
      }, 'pastry')
      useSaved(saved)
    }
    phase.value = 'finished'
    celebrating.value = true
    clearTimeout(celebrationTimer)
    celebrationTimer = setTimeout(() => { celebrating.value = false }, 1300)
  } catch (error) {
    console.error('吹灭蜡烛后保存蛋糕失败', error)
    errorMessage.value = '蛋糕还没存好，再吹一次就可以重试。'
  } finally {
    busy.value = false
  }
}

/** 创建全新的蛋糕草稿，之前的作品继续保留在历史里
 * @date 2026/11/24 11:51
 */
function startNew(copy = false) {
  replace(copy ? { ...design.value, id: newId() } : newCake())
  phase.value = 'editing'
  work.value = undefined
  showTransition.value = false
  celebrating.value = false
  void checkpoint()
}

/** 向主控报告本次蛋糕已制作完成并吹灭过蜡烛
 * @date 2026/11/24 11:51
 */
function finish() {
  if (work.value) {
    emit('completed', { status: 'completed', statistics: { workId: work.value.id, pieces: design.value.pieces.length } })
  }
}
</script>

<template>
  <section class="cake-page" :class="{ 'is-wish': phase === 'wish' }">
    <header class="cake-head">
      <p class="cake-chapter">CHAPTER 03 <span aria-hidden="true">·</span> 生日蛋糕屋</p>
      <h1>{{ phaseTitles[phase] }}</h1>
      <svg viewBox="0 0 212 18" aria-hidden="true">
        <path d="M11 13q59-12 99-5 43 7 91-3m-111 8 12-3" />
      </svg>
    </header>

    <div ref="stage" class="cake-stage">
      <CakeScene :phase="phase" :celebrating="celebrating">
        <CakeArtwork ref="art" :cake="previewDesign" :phase="phase" :selected="selected"
          :editing="phase === 'editing' && !busy" :dog-artwork="dogArtwork"
          @select="selected = $event" @move="movePiece" />
      </CakeScene>
    </div>

    <p v-if="errorMessage || saveError" class="stage-message" role="alert">{{ errorMessage || '草稿还没写入，下一次修改时会重试。' }}</p>

    <template v-if="phase === 'editing'">
      <div class="baking-tools">
        <fieldset :disabled="busy" class="sponge-tools">
          <legend>选蛋糕胚</legend>
          <div class="sponge-tray">
            <button v-for="(sponge, key) in spongeKinds" :key="key" type="button" class="bake-sticker"
              :aria-pressed="design.sponge === key" @click="edit({ ...design, sponge: key })">
              <span class="sponge-slice" :style="{ '--sponge': sponge.color, '--stripe': sponge.stripe }" aria-hidden="true"></span>
              {{ sponge.label }}
            </button>
          </div>
        </fieldset>

        <fieldset :disabled="busy" class="cream-tools">
          <legend>选奶油</legend>
          <div class="cream-swatches">
            <button v-for="(cream, key) in creams" :key="key" type="button" class="cream-dot"
              :style="{ '--cream-color': cream.color, '--cream-shade': cream.shadow }"
              :aria-label="cream.label + '奶油'" :aria-pressed="design.cream === key"
              @click="edit({ ...design, cream: key })"></button>
          </div>
        </fieldset>

        <fieldset :disabled="busy">
          <legend class="sr-only">水果和装饰</legend>
          <div class="topping-head">
            <h2>放上喜欢的装饰</h2>
            <p class="piece-count" aria-live="polite"><strong>{{ design.pieces.length }}</strong> / {{ maxPieces }} 件</p>
          </div>
          <div class="topping-tray">
            <template v-for="(name, key) in pieceNames" :key="key">
              <button v-if="key !== 'dog' || dogArtwork" type="button" class="bake-sticker topping"
                :disabled="design.pieces.length >= maxPieces" @click="place(key)">
                <svg viewBox="-23 -33 46 51" aria-hidden="true"><CakePiece :kind="key" :dog-artwork="dogArtwork" /></svg>
                {{ name }}
              </button>
            </template>
          </div>
        </fieldset>

        <details v-if="design.pieces.length" class="piece-notebook">
          <summary>微调装饰</summary>
          <fieldset :disabled="busy">
            <legend class="sr-only">选择要微调的装饰</legend>
            <div class="piece-tray">
              <button v-for="(piece, index) in design.pieces" :key="piece.id" type="button" class="piece-select"
                :aria-pressed="selected === piece.id" :aria-label="'第 ' + (index + 1) + ' 件' + pieceNames[piece.kind]"
                @click="selected = piece.id">
                <svg viewBox="-23 -33 46 51" aria-hidden="true"><CakePiece :kind="piece.kind" :dog-artwork="dogArtwork" /></svg>
                {{ index + 1 }}
              </button>
            </div>
            <template v-if="currentPiece">
              <div class="nudge-tools">
                <button type="button" aria-label="左移" @click="nudge(-6, 0)">←</button>
                <button type="button" aria-label="右移" @click="nudge(6, 0)">→</button>
                <button type="button" aria-label="上移" @click="nudge(0, -5)">↑</button>
                <button type="button" aria-label="下移" @click="nudge(0, 5)">↓</button>
                <button type="button" @click="removePiece">删除装饰</button>
              </div>
              <label class="piece-range">旋转
                <input type="range" min="0" max="359" :value="temporaryAdjustment?.values.angle ?? currentPiece.angle"
                  @input="slide($event, 'angle')" @change="slide($event, 'angle')" />
                <output>{{ temporaryAdjustment?.values.angle ?? currentPiece.angle }}°</output>
              </label>
              <label class="piece-range">缩放
                <input type="range" :min="scaleMin" :max="scaleMax" :value="temporaryAdjustment?.values.scale ?? currentPiece.scale"
                  @input="slide($event, 'scale')" @change="slide($event, 'scale')" />
                <output>{{ temporaryAdjustment?.values.scale ?? currentPiece.scale }}%</output>
              </label>
            </template>
          </fieldset>
        </details>
      </div>

      <footer class="bake-dock">
        <div class="minor-actions">
          <button type="button" :disabled="busy || !undoStack.length" @click="undo">撤销</button>
          <button type="button" :disabled="busy || !design.pieces.length"
            @click="edit({ ...design, pieces: [] }); selected = undefined">清空装饰</button>
        </div>
        <button type="button" class="cake-primary" :disabled="busy" @click="go('served')">完成制作</button>
      </footer>
    </template>

    <fieldset v-else-if="phase === 'served'" :disabled="busy" class="candle-tools cake-moment">
      <legend class="sr-only">挑选蜡烛</legend>
      <div class="candle-choices">
        <button type="button" class="bake-sticker" :aria-pressed="design.candle.kind === 'plain'"
          @click="edit({ ...design, candle: { kind: 'plain' } })">
          <svg viewBox="0 0 48 44" aria-hidden="true">
            <path d="M12 9v5m12-9v5m12-1v5" fill="none" stroke="#6b483e" stroke-width="1.6" />
            <rect x="8" y="14" width="8" height="23" rx="3" fill="#e8a9b4" />
            <rect x="20" y="10" width="8" height="27" rx="3" fill="#e6c983" />
            <rect x="32" y="14" width="8" height="23" rx="3" fill="#b2c2a6" />
            <path d="m9 24 5-4m7 1 5-4m7 7 5-4" fill="none" stroke="#fff4df" stroke-width="2" />
          </svg>
          普通蜡烛
        </button>
        <button type="button" class="bake-sticker" :aria-pressed="design.candle.kind === 'number'"
          @click="design.candle.kind !== 'number' && edit({ ...design, candle: { kind: 'number', digits: '' } })">
          <svg viewBox="0 0 48 44" aria-hidden="true">
            <path d="M24 5v4m0 21v7" fill="none" stroke="#6b483e" stroke-width="2" />
            <rect x="13" y="9" width="22" height="25" rx="6" fill="#eac993" />
            <text x="24" y="27" text-anchor="middle" font-size="18" font-family="sans-serif" font-weight="bold" fill="#715244">?</text>
          </svg>
          数字蜡烛
        </button>
      </div>
      <label v-if="design.candle.kind === 'number'" class="candle-digits">想插的数字
        <input inputmode="numeric" maxlength="2" type="text" :value="design.candle.digits"
          @input="($event.target as HTMLInputElement).value = candleDigits(($event.target as HTMLInputElement).value);
          edit({ ...design, candle: { kind: 'number', digits: ($event.target as HTMLInputElement).value } })" />
      </label>
      <button class="cake-primary" type="button" :disabled="busy || !canInsert(design.candle)" @click="go('candles')">插上蜡烛</button>
      <div class="minor-actions"><button type="button" @click="go('editing')">继续装饰</button></div>
    </fieldset>

    <div v-else-if="phase === 'candles'" class="cake-moment">
      <button type="button" class="cake-primary" :disabled="busy" @click="go('wish')">点亮蜡烛</button>
      <div v-if="!work" class="minor-actions">
        <button type="button" :disabled="busy" @click="go('served')">换蜡烛</button>
      </div>
    </div>

    <div v-else-if="phase === 'wish'" class="wish-content">
      <p class="wish-line">{{ wishCopy.message }}</p>
      <div class="wish-actions">
        <button type="button" class="cake-primary" aria-label="手动吹灭蜡烛" :disabled="busy" @click="blow">
          {{ busy ? '正在保存蛋糕…' : '许好愿啦，吹蜡烛' }}
        </button>
        <p class="wish-hint">无需麦克风权限也能完成</p>
        <div class="minor-actions">
          <button v-if="!microphone.listening.value" type="button" :disabled="busy || microphone.acquiring.value"
            @click="microphone.start">用麦克风吹气</button>
          <button v-else type="button" @click="microphone.stop(); microphone.message.value = ''">关闭麦克风</button>
        </div>
        <p v-if="microphone.message.value" class="stage-message" role="status">{{ microphone.message.value }}</p>
      </div>
    </div>

    <div v-else class="cake-moment">
      <p class="greeting-note" role="status">{{ wishCopy.finished }}</p>
      <div class="cake-result-tools">
        <ArtworkExport v-if="work" :key="work.id" :artwork="() => art?.artwork" :filename="'CAKE-' + work.id.slice(0, 10)" />
        <button type="button" class="secondary" :disabled="busy" @click="go('candles')">再吹一次蜡烛</button>
        <button v-if="context.mode !== 'story'" type="button" class="secondary" @click="startNew()">另做一个</button>
        <button v-if="context.mode !== 'story'" type="button" class="secondary" @click="startNew(true)">另存副本</button>
      </div>
      <div v-if="context.mode !== 'collection' && !context.collectionSelection" class="after-cake">
        <button v-if="!showTransition" type="button" class="cake-primary" @click="showTransition = true">继续冒险</button>
        <template v-else>
          <p>{{ dialogue.transitions.cake }}</p>
          <button type="button" class="cake-primary" @click="finish">去游乐场</button>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cake-page {
  --cake-ink: #573c32;
  --berry: #965b64;
  --hand: 'Kaiti SC', STKaiti, KaiTi, '楷体', serif;
  max-width: 34rem;
  margin-inline: auto;
  padding: .7rem 0 max(.65rem, env(safe-area-inset-bottom));
  color: var(--cake-ink);
  background: radial-gradient(ellipse at 13% 16%, #f7e6d7, transparent 39%), radial-gradient(ellipse at 88% 61%, #f7dcdd, transparent 41%), #fff8ed;
  transition: color .42s ease, background-color .42s ease;
}
.cake-page.is-wish {
  --cake-ink: #fff1d3;
  --berry: #f0d2b4;
  min-height: calc(100vh - 1.4rem);
  min-height: calc(100dvh - 1.4rem);
  display: flex;
  flex-direction: column;
  background: #332d3f;
}
:global(.phone-shell:has(.cake-page.is-wish)) { background: #332d3f; }
:global(.scene-preview:has(.cake-page.is-wish) .scene-tools) { color: #eacfb8; }
.cake-head { text-align: center; padding: .65rem .05rem .8rem; }
.cake-chapter { display: flex; align-items: center; justify-content: center; gap: .48em; margin: 0 0 .55rem; color: var(--berry); font-size: .74rem; font-weight: 750; letter-spacing: .13em; }
.cake-chapter::before, .cake-chapter::after { content: ''; width: clamp(.7rem, 5vw, 1.55rem); height: 1px; background: #cfa282; }
.cake-head h1 { margin: 0; color: var(--cake-ink); font: 720 clamp(1.3rem, 6.4vw, 2.22rem)/1.24 var(--hand); letter-spacing: -.048em; transform: rotate(-.8deg); text-shadow: .025em .025em currentColor; }
.cake-head svg { display: block; width: 46%; height: .76rem; margin: .17rem auto 0; fill: none; stroke: #d6a289; stroke-width: 3; stroke-linecap: round; }
.is-wish .cake-head svg { stroke: #c99e70; opacity: .63; }
.cake-stage { margin-inline: -.25rem; scroll-margin-top: max(.4rem, env(safe-area-inset-top)); }
.is-wish .cake-stage { margin-block: clamp(.65rem, 5dvh, 2.5rem) .1rem; }
.baking-tools { display: grid; gap: .3rem; padding: .75rem .15rem .15rem; }
fieldset { min-width: 0; border: 0; padding: 0; margin: 0; }
.baking-tools legend, .topping-head h2 { margin: 0 0 .25rem; padding: 0; color: var(--berry); font: 750 1.06rem/1.28 var(--hand); }
.sponge-tray, .topping-tray { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: .3rem; }
.topping-tray { grid-template-columns: repeat(5,minmax(0,1fr)); }
.bake-sticker {
  display: grid; place-items: center; align-content: center; justify-items: center; gap: .14rem;
  min-width: 0; min-height: 55px; padding: .14rem .07rem .2rem; border: 1px solid #e4c5ac;
  border-radius: .65rem .74rem .58rem .68rem; background: #fffaf0; color: var(--cake-ink);
  font: 720 clamp(.73rem, 3.2vw, .94rem)/1.2 var(--hand); white-space: normal;
}
.bake-sticker[aria-pressed=true] { border-color: #aa7377; background: #f9e7de; box-shadow: inset 0 0 0 1px #c89290; }
.bake-sticker:active:not(:disabled) { transform: scale(.96); }
.sponge-slice {
  width: 1.65rem; height: 1.06rem; border: 1px solid #93654d7a; border-radius: .45rem .4rem .25rem .23rem;
  background: linear-gradient(to bottom, var(--sponge) 33%, var(--stripe) 34% 49%, var(--sponge) 50% 66%, var(--stripe) 67% 77%, var(--sponge) 78%);
}
.cream-tools { padding: .13rem 0 .13rem; }
.cream-swatches { display: flex; gap: .05rem; }
.cream-dot { width: 44px; height: 44px; padding: 0; border: 0; display: grid; place-items: center; background: transparent; }
.cream-dot::before { content: ''; width: 30px; height: 30px; border-radius: 47% 53% 47% 53%; background: radial-gradient(circle at 44% 33%, var(--cream-color) 0 48%, var(--cream-shade) 96%); border: 1px solid #9e796dc0; }
.cream-dot[aria-pressed=true]::before { outline: 2px solid #a26a70; outline-offset: 2px; }
.topping-head { display: flex; justify-content: space-between; gap: .2rem; align-items: baseline; padding-inline: .05rem; }
.piece-count { margin: 0; color: #826151; font-size: .75rem; font-variant-numeric: tabular-nums; }
.piece-count strong { color: var(--berry); font-size: .95rem; }
.topping { min-height: 54px; font-size: clamp(.69rem, 2.92vw, .91rem); }
.topping svg, .piece-select svg { width: 1.7rem; height: 1.77rem; }
.piece-notebook { margin-top: .2rem; border-block: 1px dashed #d9bb9e; }
.piece-notebook summary { padding: .62rem .25rem; color: var(--berry); cursor: pointer; font: 750 1rem/1.4 var(--hand); }
.piece-notebook fieldset { padding: .08rem .08rem .55rem; }
.piece-tray, .nudge-tools { display: flex; flex-wrap: wrap; gap: .22rem; margin-bottom: .25rem; }
.piece-select, .nudge-tools button { min-width: 44px; padding: .23rem .36rem; border: 1px solid #d4b59d; border-radius: .65rem; background: #fff7e8; color: var(--cake-ink); font: inherit; font-size: .76rem; }
.piece-select { display: inline-flex; align-items: center; justify-content: center; }
.piece-select[aria-pressed=true] { border-color: #a26a70; background: #f4e0d8; }
.piece-range { display: grid; grid-template-columns: auto minmax(0, 1fr) 3.15em; align-items: center; gap: .35rem; font-size: .8rem; }
.piece-range input { min-height: 44px; width: 100%; accent-color: #a45d69; }
.piece-range output { text-align: right; font-variant-numeric: tabular-nums; }
.bake-dock { position: sticky; bottom: 0; z-index: 5; padding: .15rem .12rem max(.38rem, env(safe-area-inset-bottom)); background: #fff8edef; border-top: 1px solid #ead3bb; }
.minor-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .27rem .75rem; }
.minor-actions button {
  padding: 0 .31rem; border: 0; background: transparent; color: var(--berry);
  text-decoration: underline; text-underline-offset: .2em; font: 720 .88rem/1.4 var(--hand);
}
.cake-primary {
  min-height: 49px; width: 100%; padding: .42rem .66rem; text-align: center;
  border: 1.5px solid #8f6f52; border-radius: 1.75rem; background: #f4daa1; color: #573d31;
  box-shadow: 0 2px #a57b5350, inset 0 1px #fff0c8; font: 750 1.13rem/1.2 var(--hand);
}
.cake-primary:disabled { cursor: default; box-shadow: none; }
.cake-moment { padding: .85rem .18rem .16rem; text-align: center; }
.candle-choices { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: .5rem; margin-bottom: .6rem; }
.candle-choices .bake-sticker { min-height: 71px; font-size: .92rem; }
.candle-choices svg { width: 2.32rem; height: 2.12rem; }
.candle-digits { display: flex; align-items: center; justify-content: center; gap: .5rem; margin: .24rem 0 .58rem; font-size: .9rem; }
.candle-digits input { width: 5.1rem; min-height: 44px; border: 1px solid #c59b83; border-radius: .6rem; background: #fffaf3; padding: .24rem .48rem; color: #5a4336; font: inherit; font-size: 1rem; }
.stage-message { margin: .5rem 0; text-align: center; font-size: .8rem; }
.wish-content { display: flex; flex: 1; flex-direction: column; justify-content: space-between; gap: 1.55rem; padding: .4rem .18rem max(.65rem, env(safe-area-inset-bottom)); text-align: center; }
.wish-line { margin: 0 auto; max-width: 19rem; color: #f2dcc2; font: 730 1rem/1.5 var(--hand); }
.wish-hint { margin: .55rem 0 0; color: #e6c8af; font-size: .78rem; }
.greeting-note { display: table; margin: .1rem auto .85rem; padding: .48rem .78rem; border: 1px dashed #cb9b87; border-radius: 1.25rem .83rem 1.14rem .94rem; background: #fff1df; font: 750 1rem/1.45 var(--hand); }
.cake-result-tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .34rem; }
.cake-result-tools :deep(.secondary) { padding-inline: .57rem; font-size: .8rem; border: 1px solid #d2b29f; border-radius: 2rem; background: #fff5e8; color: #775047; }
.cake-result-tools :deep(.download) { text-align: center; }
.cake-result-tools :deep(.download img) { margin-inline: auto; background: #fff8e9; }
.after-cake { margin-top: .8rem; }
.after-cake p { max-width: 20rem; margin: .5rem auto .65rem; font: 750 1rem/1.5 var(--hand); }
</style>

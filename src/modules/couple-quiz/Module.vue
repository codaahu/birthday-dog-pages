<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, toRaw } from 'vue'
import { dialogue } from '../../config/dialogue'
import type { ModuleCompletion } from '../../core/story/contract'
import { newId } from '../../core/storage/id'
import type { GameResult } from '../../core/storage/types'
import { quizCopy, quizVersion } from './config'
import { answerQuestion, quizQuestions, quizSnapshot } from './quiz'
import QuizStage from './QuizStage.vue'
import type { ModuleProps, OptionId, QuizRound } from './types'

const props = defineProps<ModuleProps>()
const emit = defineEmits<{ completed: [result: ModuleCompletion] }>()

const storyId = props.context.mode === 'story' && props.context.runId
  ? 'couple-quiz:' + props.context.runId
  : undefined
const restored = props.context.draft?.quiz as QuizRound | undefined
const round = shallowRef(restored?.questions?.[restored.position] && Array.isArray(restored.answers) ? toRaw(restored) : undefined)
const saved = ref<GameResult>()
const busy = ref(Boolean(round.value || storyId))
const error = ref('')
const transition = ref(false)
const changedPhoto = ref<string>()
const questionHeading = ref<HTMLElement>()

const questions = computed(() => round.value?.questions ?? quizQuestions(props.context.photos.photos))
const position = computed(() => round.value?.position ?? 0)
const question = computed(() => questions.value[position.value])
const answer = computed(() => round.value?.answers.find((item) => item.questionId === question.value?.id)?.option)
const mood = computed(() => saved.value ? 'result' : answer.value?.mood ?? 'host')
const lastQuestion = computed(() => position.value + 1 === questions.value.length)
const photo = computed(() => changedPhoto.value === question.value?.id ? undefined : question.value?.photo)
const photoSrc = computed(() => photo.value?.image.startsWith('data:') ? photo.value.image : import.meta.env.BASE_URL + photo.value?.image)

onMounted(async () => {
  const id = round.value?.id ?? storyId
  if (!id) {
    return
  }
  try {
    const history = await props.context.data.history.read()
    saved.value = history.results.find((item) => item.id === id && item.kind === 'couple-quiz' && item.status === 'completed')
  } catch (cause) {
    console.error('恢复默契问答记录失败', cause)
    error.value = '暂时没读到已保存的结果，可以继续本轮。'
  } finally {
    busy.value = false
  }
})

/**
 * 首次点选时冻结题库，同时保存当前答案和原文反馈
 *
 * @date 2026/11/24 16:48
 * @param id 玩家选中的单选项
 */
async function choose(id: OptionId) {
  if (busy.value || answer.value || saved.value) {
    return
  }
  const previous = round.value
  const current = previous ?? {
    id: storyId ?? newId(), version: quizVersion, questions: questions.value, answers: [], position: 0,
  }
  const next = answerQuestion(current, id)
  if (next === current) {
    return
  }
  busy.value = true
  error.value = ''
  round.value = next
  try {
    await props.context.data.saveDraft({ quiz: next })
  } catch (cause) {
    console.error('保存默契问答选项失败', cause)
    round.value = previous
    error.value = '这个选项还没存好，再点一次吧。'
  } finally {
    busy.value = false
  }
}

/**
 * 保存下一题位置，最后一题将冻结快照提交给历史存档
 *
 * @date 2026/11/24 16:48
 */
async function nextQuestion() {
  const current = round.value
  if (busy.value || !answer.value || !current || saved.value) {
    return
  }
  busy.value = true
  error.value = ''
  try {
    if (lastQuestion.value) {
      saved.value = await props.context.data.history.saveResult({
        id: current.id, runId: props.context.runId, kind: 'couple-quiz', status: 'completed',
        answerSnapshot: quizSnapshot(current), details: { title: quizCopy.result, answered: current.answers.length },
      })
    } else {
      const next = { ...current, position: current.position + 1 }
      await props.context.data.saveDraft({ quiz: next })
      round.value = next
    }
    await nextTick()
    questionHeading.value?.focus({ preventScroll: true })
  } catch (cause) {
    console.error('推进默契问答或保存结算失败', cause)
    error.value = '进度还没存好，再试一次吧。'
  } finally {
    busy.value = false
  }
}

/**
 * 真实图片打不开时略过当前未作答的可选题
 *
 * @date 2026/11/24 16:48
 */
async function omitPhotoQuestion() {
  const current = round.value
  const item = question.value
  changedPhoto.value = item?.id
  if (!current || !item?.photoId || answer.value || busy.value) {
    return
  }
  const remaining = current.questions.filter((entry) => entry.id !== item.id)
  const next = { ...current, questions: remaining, position: Math.min(current.position, remaining.length - 1) }
  busy.value = true
  round.value = next
  try {
    await props.context.data.saveDraft({ quiz: next })
  } catch (cause) {
    console.error('跳过缺图的默契问答题失败', cause)
    error.value = '已略过缺图题，下次操作时会重新保存进度。'
  } finally {
    busy.value = false
  }
}

/**
 * 清空独立玩法的当前草稿并开始新的轮次
 *
 * @date 2026/11/24 16:48
 */
async function playAgain() {
  if (busy.value || props.context.mode === 'story') {
    return
  }
  busy.value = true
  error.value = ''
  try {
    await props.context.data.saveDraft({})
    saved.value = undefined
    round.value = undefined
    transition.value = false
    changedPhoto.value = undefined
  } catch (cause) {
    console.error('开启新一轮默契问答失败', cause)
    error.value = '新一轮还没准备好，再试一次吧。'
  } finally {
    busy.value = false
  }
}

/**
 * 上报已保存的问答结果，章节及狗狗币由主线结算
 *
 * @date 2026/11/24 16:48
 */
function finish() {
  if (saved.value) {
    emit('completed', { status: 'completed', statistics: {
      resultId: saved.value.id, answered: saved.value.details?.answered,
    } })
  }
}
</script>

<template>
  <section class="quiz-page">
    <header class="quiz-head">
      <p class="chapter-label">CHAPTER 04 <span aria-hidden="true">·</span> 快乐游乐场</p>
      <h1>{{ quizCopy.title }}</h1>
      <svg viewBox="0 0 204 16" aria-hidden="true"><path d="M13 11q48-11 91-4t87-3" /></svg>
    </header>

    <div v-if="!saved" class="quiz-progress">
      <p><span>趣味问答</span><strong>{{ position + 1 }} / {{ questions.length }}</strong></p>
      <progress :value="position + 1" :max="questions.length" aria-label="问答进度"></progress>
    </div>

    <QuizStage :mood="mood" />

    <template v-if="!saved && question">
      <div class="question-paper">
        <img v-if="photo" class="question-photo" :src="photoSrc" :alt="photo.title || '题目照片'"
          :width="photo.width" :height="photo.height" @error="omitPhotoQuestion" />
        <h2 ref="questionHeading" tabindex="-1">{{ question.prompt }}</h2>
        <div class="answer-sheet" role="group" aria-label="选择一个答案">
          <button v-for="option in question.options" :key="option.id" type="button" class="quiz-option"
            :disabled="busy || Boolean(answer)" :aria-pressed="answer?.id === option.id" @click="choose(option.id)">
            <span class="option-id">{{ option.id }}</span><span>{{ option.text }}</span>
            <svg v-if="answer?.id === option.id" viewBox="0 0 22 22" aria-hidden="true">
              <path d="m4 12 5 5L18 6" />
            </svg>
          </button>
        </div>
      </div>

      <div class="answer-end" aria-live="polite">
        <Transition name="reaction">
          <p v-if="answer" :key="question.id" class="reply">{{ answer.feedback }}</p>
        </Transition>
      </div>
      <button v-if="answer" type="button" class="quiz-primary" :disabled="busy" @click="nextQuestion">
        {{ lastQuestion ? '查看默契结果' : '下一题' }}
      </button>
    </template>

    <template v-if="saved">
      <div ref="questionHeading" class="quiz-result" role="status" tabindex="-1">
        <p class="affinity">{{ quizCopy.affinity }} <strong>100%</strong></p>
        <h2>{{ quizCopy.result }}</h2>
        <p class="verdict">{{ quizCopy.verdict }}</p>
      </div>
      <div class="quiz-finish">
        <template v-if="context.mode !== 'collection'">
          <button v-if="!transition" type="button" class="quiz-primary" @click="transition = true">继续冒险</button>
          <template v-else>
            <p class="reply">{{ dialogue.transitions.playground }}</p>
            <button type="button" class="quiz-primary" @click="finish">去扭蛋铺</button>
          </template>
        </template>
        <button v-if="context.mode !== 'story'" type="button" class="quiz-again" :disabled="busy" @click="playAgain">再答一次</button>
      </div>
    </template>

    <p v-if="error" class="quiz-error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.quiz-page {
  --quiz-ink: #594233;
  --quiz-olive: #547052;
  --hand: 'Kaiti SC', STKaiti, KaiTi, '楷体', serif;
  max-width: 31rem;
  margin-inline: auto;
  padding: .68rem .12rem max(.55rem, env(safe-area-inset-bottom));
  color: var(--quiz-ink);
  background: radial-gradient(ellipse at 91% 18%, #e8edda, transparent 45%), radial-gradient(ellipse at 7% 68%, #f9eac7, transparent 46%), #fff9ed;
}
.quiz-head { text-align: center; padding: .45rem .12rem .32rem; }
.chapter-label { display: flex; justify-content: center; align-items: center; gap: .46em; margin: 0 0 .5rem; color: var(--quiz-olive); font-size: .73rem; font-weight: 750; letter-spacing: .12em; }
.chapter-label::before, .chapter-label::after { content: ''; height: 1px; width: clamp(.7rem, 5vw, 1.5rem); background: #bdab78; }
.quiz-head h1 { margin: 0; font: 750 clamp(1.48rem, 7vw, 2.45rem)/1.23 var(--hand); letter-spacing: -.06em; transform: rotate(-1deg); text-shadow: .024em .024em currentColor; }
.quiz-head svg { display: block; width: 42%; height: .66rem; margin: .16rem auto 0; fill: none; stroke: #d7ac75; stroke-width: 3; stroke-linecap: round; }
.quiz-progress { margin: .22rem .07rem .55rem; }
.quiz-progress p { display: flex; justify-content: space-between; align-items: center; margin: 0 0 .3rem; padding-inline: .13rem; color: #706a50; font-size: .77rem; }
.quiz-progress strong { color: var(--quiz-olive); font-variant-numeric: tabular-nums; letter-spacing: .05em; }
.quiz-progress progress { display: block; width: 100%; height: 5px; border: 0; border-radius: 2rem; background: #e8e5cb; overflow: hidden; }
.quiz-progress progress::-webkit-progress-bar { background: #e8e5cb; }
.quiz-progress progress::-webkit-progress-value { background: #a0b78f; border-radius: 2rem; }
.quiz-progress progress::-moz-progress-bar { background: #a0b78f; }
.question-paper { padding: .69rem .03rem 0; }
.question-photo { display: block; width: 100%; height: auto; max-height: 32dvh; object-fit: contain; border-radius: .7rem; margin: 0 auto .65rem; background: #fff8e9; }
.question-paper h2 { margin: 0 .15rem .52rem; font: 750 clamp(1.04rem, 4.85vw, 1.41rem)/1.36 var(--hand); letter-spacing: -.015em; }
.question-paper h2:focus, .quiz-result:focus { outline: none; }
.answer-sheet { display: grid; gap: .34rem; }
.quiz-option {
  display: grid; grid-template-columns: 1.68rem minmax(0,1fr) 1.24rem; align-items: center; gap: .5rem;
  width: 100%; min-height: 47px; padding: .24rem .6rem; color: var(--quiz-ink); background: #fffaf0;
  border: 1px solid #dccaac; border-radius: .76rem .63rem .71rem .82rem; text-align: start;
  box-shadow: 0 1px #aa835d21; font: 710 clamp(.89rem, 3.98vw, 1.05rem)/1.22 var(--hand);
}
.quiz-option:disabled { cursor: default; opacity: 1; }
.quiz-option[aria-pressed=true] { border-color: #8a9f77; background: #e9efd9; box-shadow: inset 0 0 0 1px #a5b38e; }
.quiz-option .option-id { display: grid; place-items: center; width: 1.57rem; height: 1.55rem; border: 1px solid #c7a771; border-radius: 48% 44% 48% 46%; background: #f8e8be; color: #76613f; font: 750 .78rem/1 system-ui,sans-serif; }
.quiz-option[aria-pressed=true] .option-id { border-color: #829776; background: #d9e5c5; color: #4e694f; }
.quiz-option svg { width: 1.14rem; height: auto; fill: none; stroke: #6d8a63; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.answer-end:empty { display: none; }
.reply {
  margin: .62rem .1rem .53rem; padding: .44rem .62rem; border: 1px dashed #ceb48c;
  border-radius: .84rem .96rem .74rem .87rem; background: #f8eac8; color: #705239;
  text-align: center; font: 750 clamp(.9rem, 4.08vw, 1.07rem)/1.38 var(--hand);
}
.reaction-enter-active, .reaction-leave-active { transition: transform .19s ease, opacity .14s ease; }
.reaction-enter-from { transform: translateY(.25rem); opacity: 0; }
.reaction-leave-to { opacity: 0; }
.quiz-primary { width: 100%; min-height: 46px; border: 1.5px solid #8c6c47; border-radius: 1.65rem; padding: .31rem .62rem; color: #5d4532; background: #f4d99d; box-shadow: 0 2px #aa82534a, inset 0 1px #f9e9c1; font: 750 1.06rem/1.2 var(--hand); }
.quiz-primary:active:not(:disabled) { transform: translateY(1px); }
.quiz-result {
  position: relative; max-width: 25rem; margin: 1.04rem auto .82rem; padding: .65rem .67rem .84rem; text-align: center;
  border: 1px dashed #bf9d70; border-radius: .9rem .82rem .97rem .73rem; background: #fff5da; box-shadow: .17rem .22rem #c7a77340;
}
.quiz-result::before { content: ''; position: absolute; left: calc(50% - 1.8rem); top: -.31rem; width: 3.6rem; height: .65rem; background: #dfb38d77; transform: rotate(-4deg); }
.quiz-result .affinity { margin: .12rem 0; font: 720 .92rem/1.15 var(--hand); color: #785741; }
.affinity strong { margin-inline-start: .22rem; color: #ae6849; font: 850 clamp(1.85rem, 9vw, 2.58rem)/1 system-ui,sans-serif; font-variant-numeric: tabular-nums; }
.quiz-result h2 { margin: .47rem 0 .35rem; color: var(--quiz-olive); font: 750 clamp(1.38rem, 6vw, 1.86rem)/1.1 var(--hand); }
.quiz-result .verdict { margin: 0; color: #785742; font: 730 .9rem/1.45 var(--hand); }
.quiz-finish { display: grid; gap: .19rem; }
.quiz-again { justify-self: center; padding: 0 .42rem; border: 0; background: transparent; color: var(--quiz-olive); text-decoration: underline; text-underline-offset: .18em; font: 750 .96rem/1.23 var(--hand); }
.quiz-error { margin: .52rem .12rem .05rem; color: #894f45; font-size: .8rem; text-align: center; }
</style>

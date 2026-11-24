<script setup lang="ts">
import { computed } from 'vue'
import { achievementNames, type AchievementId } from '../../config/achievements'
import { dialogue } from '../../config/dialogue'
import { personal } from '../../config/personal'
import { photoCategories, type Photo, type PhotoCategory } from '../../config/photos'
import { ordinaryTickets, weekendTicket } from '../../config/rewards'
import type { ModuleId } from '../../config/storyFlow'
import { ticketStatus } from '../../core/rewards/ticketStatus'
import type { CollectionSelection } from '../../core/story/contract'
import type { GameResult } from '../../core/storage/types'
import HouseSticker from './HouseSticker.vue'
import type { HouseArchive, HousePage, RevealedTickets } from './types'

const props = defineProps<{ page: HousePage; history: HouseArchive; photos: readonly Photo[]; tickets: RevealedTickets; now: number }>()
defineEmits<{
  open: [id: ModuleId, selection?: CollectionSelection]
  show: [page: HousePage]
  favorite: [id: string, value: boolean]
}>()
const gameKinds = [
  { kind: 'catch-gifts', name: '接礼物挑战', module: 'catch-gifts' },
  { kind: 'puzzle', name: '合照拼图', module: 'memory-room' },
  { kind: 'couple-quiz', name: '默契问答', module: 'couple-quiz' },
] as const
const categories: Record<PhotoCategory, string> = { couple: '情侣合照', portrait: '专属摄影展', travel: '旅行手账',
  daily: '日常与美食', engagement: '订婚纪念', funny: '搞怪相册', puzzle: '拼图照片', pet: '狗狗秘密相册' }
const hiddenAchievements = new Set<AchievementId>(['funny-album', 'pet-discovery', 'dog-petting'])
const captions = { bouquet: '我的花束', cake: '我的蛋糕', albums: '回忆相册', letter: '生日来信',
  games: '小游戏', gifts: '我的兑换券', collection: '我的收藏', home: '小屋', settings: '设置' }
const dateFormat = new Intl.DateTimeFormat('zh-CN', { timeZone: personal.timeZone, dateStyle: 'medium' })
const albums = computed(() => photoCategories.flatMap((category) => {
  if (category === 'puzzle' || (category === 'funny' || category === 'pet')
    && !props.history.easterEggs.some(({ id }) => id === category + '-album')) {
    return []
  }
  const items = props.photos.filter((photo) => photo.category === category)
  return items.length ? [{ category, items, label: categories[category] }] : []
}))
const works = computed(() => props.history.works.filter((work) => work.kind === props.page)
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
const sortedGames = computed(() => [...props.history.results].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
const allAchievements = computed(() => Object.entries(achievementNames).map(([key, name]) => {
  const unlocked = props.history.achievements.some(({ id }) => id === key)
  return { key, unlocked, name: !unlocked && hiddenAchievements.has(key as AchievementId) ? '？？？' : name }
}))
const ticketNames = new Map([...ordinaryTickets, weekendTicket].map(({ type, name }) => [type, name]))
const letter = dialogue.letter

/**
 * 解析正式照片路径，开发插画使用自己的数据地址
 *
 * @date 2026/11/24 19:29
 * @param path 素材清单中的缩略图路径
 * @return 当前预览可加载的图片地址
 */
function imageSource(path: string) {
  return path.startsWith('data:') ? path : import.meta.env.BASE_URL + path
}

/**
 * 以北京时间显示存档日期
 *
 * @date 2026/11/24 19:28
 * @param value 存档的日期时间
 * @return 兼容缺少旧日期的显示文字
 */
function recordDate(value: string) {
  const time = Date.parse(value)
  return Number.isFinite(time) ? dateFormat.format(time) : '日期未记录'
}

/**
 * 读取问答记录里实际选过的选项和反馈
 *
 * @date 2026/11/24 19:28
 * @param result 已完成的历史问答记录
 * @return 以题目顺序保存的原题、选项和反馈
 */
function answers(result: GameResult) {
  const { questions, answers: recorded } = result.answerSnapshot ?? {}
  if (!Array.isArray(questions) || !Array.isArray(recorded)) {
    return []
  }
  return questions.flatMap((question) => {
    if (typeof question?.prompt !== 'string') {
      return []
    }
    const option = recorded.find((entry) => entry?.questionId === question.id)?.option
    return typeof option?.text === 'string' ? [{ prompt: question.prompt as string, text: option.text as string,
      feedback: typeof option.feedback === 'string' ? option.feedback as string : '' }] : []
  })
}

/**
 * 汇总接礼物真实历史中的第一局、最近一局和累计抓取数
 *
 * @date 2026/11/24 19:28
 * @param results 按日期逆序的接礼物记录
 * @return 分数及累计数量，旧记录未记录礼物数时注明
 */
function catchHistory(results: GameResult[]) {
  const scored = results.filter(({ score }) => typeof score === 'number')
  if (!scored.length) {
    return ''
  }
  const gifts = scored.map(({ details }) => details?.gifts)
  const count = gifts.reduce<number>((sum, value) => sum + (typeof value === 'number' ? value : 0), 0)
  return '最高 ' + scored.reduce((best, { score }) => Math.max(best, score!), 0) + ' 分 · 首次 '
    + scored[scored.length - 1].score + ' 分 · 最近 ' + scored[0].score + ' 分 · '
    + (gifts.every((n) => typeof n === 'number') ? '累计接住 ' + count + ' 件' : '已记录接住 ' + count + ' 件')
}
</script>

<template>
  <section class="shelf" :aria-label="captions[page]">
    <h2>{{ captions[page] }}</h2>
    <template v-if="page === 'albums'">
      <p v-if="!albums.length">相册还没有照片。</p>
      <div v-else class="albums">
        <button v-for="album in albums" :key="album.category" type="button" class="polaroid"
          @click="$emit('open', 'memory-room', { album: album.category })">
          <img :src="imageSource(album.items[0].thumbnail)" alt="" loading="lazy" />
          {{ album.label }}
        </button>
      </div>
      <button class="small-link" type="button" @click="$emit('open', 'memory-room')">去回忆小屋</button>
    </template>

    <template v-else-if="page === 'bouquet' || page === 'cake'">
      <p v-if="!works.length">这一格还没有作品。</p>
      <ul v-else class="records">
        <li v-for="(work, index) in works" :key="work.id">
          <button type="button" class="work-link" @click="$emit('open', work.kind === 'cake' ? 'cake-shop' : 'flower-shop', { workId: work.id })">
            <HouseSticker :kind="work.kind" /><span>{{ work.kind === 'cake' ? '生日蛋糕' : '生日花束' }} {{ works.length - index }}
              <small>{{ recordDate(work.createdAt) }}</small></span>
          </button>
          <button class="favorite" type="button" :aria-label="work.favorite ? '取消喜欢' : '标记喜欢'"
            :aria-pressed="work.favorite" @click="$emit('favorite', work.id, !work.favorite)">{{ work.favorite ? '♥' : '♡' }}</button>
        </li>
      </ul>
      <button class="small-link" type="button" @click="$emit('open', page === 'cake' ? 'cake-shop' : 'flower-shop')">制作新作品</button>
    </template>

    <template v-else-if="page === 'games'">
      <section v-for="game in gameKinds" :key="game.kind" class="game">
        <header><h3>{{ game.name }}</h3><button class="small-link" type="button"
          @click="$emit('open', game.module, game.kind === 'puzzle' ? { puzzle: true } : undefined)">去玩</button></header>
        <p v-if="game.kind === 'catch-gifts'">{{ catchHistory(sortedGames.filter(({ kind }) => kind === game.kind)) }}</p>
        <p v-if="!sortedGames.some(({ kind }) => kind === game.kind)">还没有游玩记录。</p>
        <details v-for="result in sortedGames.filter(({ kind }) => kind === game.kind)" :key="result.id">
          <summary>{{ recordDate(result.createdAt) }} <span>{{ result.status === 'skipped' ? '已跳过' : result.score === undefined ? '已完成' : result.score + ' 分' }}</span></summary>
          <p v-if="game.kind === 'catch-gifts'">
            {{ result.details?.title || '接礼物挑战' }}<span v-if="typeof result.details?.gifts === 'number'"> · 接住 {{ result.details.gifts }} 件</span>
          </p>
          <template v-else-if="game.kind === 'puzzle'">
            <p><span v-if="result.timeMs !== undefined">用时 {{ Math.round(result.timeMs / 1000) }} 秒</span>
              <span v-if="result.moves !== undefined"> · 交换 {{ result.moves }} 次</span></p>
            <template v-if="typeof result.details?.photoId === 'string'">
              <img v-if="photos.find(({ id }) => id === result.details?.photoId)" class="puzzle-photo"
                :src="imageSource(photos.find(({ id }) => id === result.details?.photoId)!.thumbnail)" alt="这局拼图的照片" />
              <p v-else>这张拼图照片已不在当前相册。</p>
            </template>
          </template>
          <template v-else>
            <p v-if="result.details?.title">{{ result.details.title }}</p>
            <p v-for="answer in answers(result)" :key="answer.prompt"><b>{{ answer.prompt }}</b><br />{{ answer.text }} · {{ answer.feedback }}</p>
          </template>
        </details>
      </section>
    </template>

    <template v-else-if="page === 'gifts'">
      <p v-if="!tickets.length">扭蛋券还没放进这里。</p>
      <ul v-else class="records ticket-list">
        <li v-for="{ ticket } in tickets" :key="ticket.id"><strong>{{ ticketNames.get(ticket.type) }}</strong>
          <span>{{ ticketStatus(ticket, now) }}</span></li>
      </ul>
      <button class="small-link" type="button" @click="$emit('open', 'gashapon')">查看券面与兑现</button>
    </template>

    <template v-else-if="page === 'letter'">
      <article class="letter"><p v-for="line in letter" :key="line">{{ line }}</p></article>
    </template>

    <template v-else-if="page === 'collection'">
      <div class="shortcuts">
        <button v-for="entry in (['albums', 'bouquet', 'cake', 'letter'] as const)" :key="entry"
          type="button" class="small-link" @click="$emit('show', entry)">{{ captions[entry] }}</button>
      </div>
      <h3>成就图鉴</h3>
      <ul class="achievement-list">
        <li v-for="achievement in allAchievements" :key="achievement.key" :class="{ unlocked: achievement.unlocked }">
          <span aria-hidden="true">{{ achievement.unlocked ? '✦' : '✧' }}</span>
          {{ achievement.name }}
          <small>{{ achievement.unlocked ? '已解锁' : '待解锁' }}</small>
        </li>
      </ul>
      <h3>冒险纪念</h3>
      <p v-if="!history.completions.length">尚未收藏冒险记录。</p>
      <ol v-else class="visits"><li v-for="record in history.completions" :key="record.id">{{ recordDate(record.createdAt) }} · 完成生日冒险</li></ol>
    </template>
  </section>
</template>

<style scoped>
.shelf { color: #67462f; margin: .38rem 0 .65rem; padding: .85rem .8rem 1rem; background: #fff6e5;
  border: 1px solid #ddb88d; border-radius: .75rem .95rem .72rem .9rem; box-shadow: .15rem .21rem #d8a47733; text-align: left; }
h2 { text-align: center; font-size: 1.27rem; margin: 0 0 .67rem; }
h3 { font-size: 1rem; margin: .55rem 0; } p { margin: .45rem 0; }
.small-link, .favorite, .work-link { color: inherit; border: 0; background: transparent; padding: .18rem .35rem; }
.small-link { text-decoration: underline; text-underline-offset: .22rem; font-weight: 700; }
.records { list-style: none; padding: 0; margin: 0; }
.records li, .game header { display: flex; align-items: center; gap: .5rem; justify-content: space-between; }
.records li { border-bottom: 1px dashed #d9b189; min-height: 3rem; }
.work-link { display: flex; align-items: center; text-align: left; font-weight: 750; gap: .45rem; }
.work-link small { display: block; font-weight: 450; }
.favorite { min-width: 44px; color: #a75755; font-size: 1.35rem; }
.ticket-list li span { color: #536144; }
.albums { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: .55rem; }
.polaroid { padding: .32rem .32rem .45rem; color: inherit; background: #fffaf1; border: 1px solid #dfbe9b; border-radius: .3rem;
  box-shadow: .15rem .16rem #d8a47736; font-size: .86rem; }
.polaroid img { display: block; width: 100%; height: 5.5rem; margin-bottom: .3rem; object-fit: contain; background: #efe1c8; }
.game + .game { border-top: 1px dashed #d9b189; margin-top: .6rem; padding-top: .35rem; }
.game p { color: #735842; font-size: .86rem; }
details { padding: .28rem 0; border-bottom: 1px dashed #d9b189; }
summary { cursor: pointer; min-height: 44px; line-height: 2.6; font-size: .88rem; }
summary span { float: right; color: #536144; }
.puzzle-photo { max-height: 9rem; max-width: 100%; object-fit: contain; }
.shortcuts { display: flex; flex-wrap: wrap; gap: .19rem .38rem; }
.achievement-list { list-style: none; padding: 0; margin: 0 0 .7rem; }
.achievement-list li { padding: .31rem .1rem; border-bottom: 1px dashed #d9b189; color: #735e4b; }
.achievement-list li.unlocked { color: #566642; font-weight: 700; }
.achievement-list small { float: right; }
.visits { padding-left: 1.28rem; margin: 0; }
.letter { background: repeating-linear-gradient(transparent 0 1.55rem,#dfb37d38 1.55rem 1.62rem); }
.letter p { line-height: 1.65; margin: 0 0 .72rem; }
.letter p:last-child { text-align: right; font-weight: 750; }
</style>

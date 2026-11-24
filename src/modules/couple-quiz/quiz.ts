import type { Photo } from '../../config/photos'
import { confirmedQuestions, extraQuizQuestions } from './config'
import type { OptionId, QuizQuestion, QuizRound, RoundQuestion } from './types'

/**
 * 生成可作答题目，跳过未提供照片的扩展题
 *
 * @date 2026/11/24 16:46
 * @param photos 当前照片清单
 * @param extra 已配置的扩展题
 * @return 可冻结到当前轮的题目和照片显示数据
 */
export function quizQuestions(photos: readonly Photo[], extra = extraQuizQuestions): RoundQuestion[] {
  const byId = new Map(photos.map((photo) => [photo.id, photo]))
  const questions: RoundQuestion[] = []
  for (const item of [...confirmedQuestions, ...extra.slice(0, 4)]) {
    const options = item.options.map((option) => ({ ...option }))
    const question: RoundQuestion = { ...item, options }
    if (item.photoId) {
      const photo = byId.get(item.photoId)
      if (!photo) {
        continue
      }
      const { id, image, title, width, height } = photo
      question.photo = { id, image, title, width, height }
    }
    questions.push(question)
  }
  return questions
}

/**
 * 只记录当前未作答题目的合法选项，快照保留选项和反馈原文
 *
 * @date 2026/11/24 16:46
 * @param round 当前轮的冻结题目和已有答案
 * @param optionId 玩家点选的选项
 * @return 第一次有效答题后的状态，重复或无效选择保持原状态
 */
export function answerQuestion(round: QuizRound, optionId: OptionId): QuizRound {
  const question = round.questions[round.position]
  const option = question?.options.find((item) => item.id === optionId)
  if (!option || round.answers.some((answer) => answer.questionId === question.id)) {
    return round
  }
  return { ...round, answers: [...round.answers, { questionId: question.id, option: { ...option } }] }
}

/**
 * 保存题库版本、题目及选项，历史成绩通过照片 ID 引用素材
 *
 * @date 2026/11/24 16:46
 * @param round 已冻结并作答的题目轮次
 * @return 独立于实时题库的历史快照
 */
export function quizSnapshot(round: QuizRound) {
  const questions: QuizQuestion[] = round.questions.map(({ id, prompt, options, photoId }) => ({ id, prompt, options, photoId }))
  return { version: round.version, questions, answers: round.answers }
}

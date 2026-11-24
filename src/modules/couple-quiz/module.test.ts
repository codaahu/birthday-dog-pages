import { describe, expect, it } from 'vitest'
import { moduleIds } from '../../config/storyFlow'
import { config, confirmedQuestions, quizVersion } from './config'
import Module from './Module.vue'
import { answerQuestion, quizQuestions, quizSnapshot } from './quiz'
import type { QuizRound } from './types'

describe('默契问答', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('couple-quiz')
    expect(Module).toBeDefined()
  })

  it('提供四道派对题，每题四个可选答案及反馈', () => {
    expect(confirmedQuestions.map(({ prompt }) => prompt)).toEqual([
      '生日派对的小狗助手可以做什么？',
      '派对纪念照拍糊了，应该怎么办？',
      '今天谁说了算？',
      '到达小狗派对后，你想先做什么？',
    ])
    for (const { options } of confirmedQuestions) {
      expect(options.map(({ id }) => id)).toEqual(['A', 'B', 'C', 'D'])
      expect(options.every(({ text, feedback }) => text && feedback)).toBe(true)
    }
  })

  it('跳过缺图扩展题，保留有图题且保留四道演示题', () => {
    const extra = { ...confirmedQuestions[0], id: 'photo-extra', photoId: 'trip' }
    expect(quizQuestions([], [extra])).toHaveLength(4)
    const withPhoto = quizQuestions([
      { id: 'trip', category: 'travel', image: 'photos/trip.webp', thumbnail: 'photos/t.webp', width: 640, height: 480 },
    ], [extra])
    expect(withPhoto).toHaveLength(5)
    expect(withPhoto[4].photo).toMatchObject({ id: 'trip', image: 'photos/trip.webp' })
  })

  it('每题只接受一次选择，保存实际选项和反馈的冻结快照', () => {
    const round: QuizRound = { id: 'test', version: quizVersion, questions: quizQuestions([]), position: 0, answers: [] }
    const selected = answerQuestion(round, 'D')
    expect(answerQuestion(selected, 'A')).toBe(selected)
    const snapshot = quizSnapshot(selected)
    expect(snapshot.version).toBe(quizVersion)
    expect(snapshot.answers).toMatchObject([{
      questionId: 'travel-role', option: { id: 'D', text: '以上全部', feedback: '恭喜解锁全能派对助手！' },
    }])
    expect(snapshot.questions[0].options).toHaveLength(4)
  })
})

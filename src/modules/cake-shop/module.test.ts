import { describe, expect, it } from 'vitest'
import { moduleIds } from '../../config/storyFlow'
import { config } from './config'
import Module from './Module.vue'
import { addPiece, candleDigits, canInsert, changePiece, newCake, resumePhase } from './cake'

describe('生日蛋糕屋', () => {
  it('注册独立组件和模块配置', () => {
    expect(moduleIds).toContain(config.id)
    expect(config.id).toBe('cake-shop')
    expect(Module).toBeDefined()
  })

  it('装饰达到 12 件后不再添加，更新时只改目标图层', () => {
    let cake = newCake()
    for (let count = 0; count < 12; count += 1) {
      cake = addPiece(cake, 'strawberry')
    }
    expect(addPiece(cake, 'bow')).toBe(cake)
    const first = cake.pieces[0]
    const adjusted = changePiece(cake, first.id, { x: 500, y: 182, angle: -30, scale: 230 })
    expect(adjusted.pieces[0]).toMatchObject({ x: 267, y: 182, angle: 330, scale: 150 })
    expect(adjusted.pieces[1]).toBe(cake.pieces[1])
    expect(cake.pieces[0]).toBe(first)
  })

  it('数字由用户填写，许愿中断后需要重新点亮', () => {
    expect(newCake().candle).toEqual({ kind: 'plain' })
    expect(canInsert({ kind: 'number', digits: '' })).toBe(false)
    expect(canInsert({ kind: 'number', digits: candleDigits('a24!') })).toBe(true)
    expect(candleDigits('1234')).toBe('12')
    expect(resumePhase('served')).toBe('served')
    expect(resumePhase('wish')).toBe('candles')
  })
})

import { describe, expect, it } from 'vitest'
import { initialZoom, swipeDirection, transformPhoto } from './albumGestures'

describe('相册手势', () => {
  it('只让达到阈值的水平移动翻页', () => {
    expect(swipeDirection({ x: -71, y: 12 })).toBe(1)
    expect(swipeDirection({ x: 57, y: -15 })).toBe(-1)
    expect(swipeDirection({ x: -15, y: 1 })).toBe(0)
    expect(swipeDirection({ x: 55, y: 49 })).toBe(0)
  })

  it('双指以中点为锚，放大后允许平移并限制越界', () => {
    const viewport = { width: 380, height: 750 }
    const image = { width: 380, height: 285 }
    const center = { x: 0, y: 0 }
    const grip = { x: 70, y: 0 }
    const zoomed = transformPhoto(initialZoom, grip, grip, 2, viewport, image)
    expect(zoomed).toEqual({ x: -70, y: 0, scale: 2 })
    expect(transformPhoto(zoomed, center, { x: 900, y: 900 }, 1, viewport, image))
      .toEqual({ x: 190, y: 0, scale: 2 })
    expect(transformPhoto(zoomed, center, center, .25, viewport, image)).toEqual(initialZoom)
    expect(transformPhoto(zoomed, center, center, 10, viewport, image).scale).toBe(4)
  })
})

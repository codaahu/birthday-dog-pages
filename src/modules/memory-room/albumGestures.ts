export interface Point { x: number; y: number }
interface Size { width: number; height: number }
export interface ZoomView extends Point { scale: number }

export const initialZoom: ZoomView = { x: 0, y: 0, scale: 1 }

/**
 * 仅把明确的水平滑动识别为翻页
 *
 * @date 2026/11/24 14:44
 * @param delta 接触点相对于按下位置的偏移
 * @return -1 表示上一张，1 表示下一张，0 表示保持当前照片
 */
export function swipeDirection(delta: Point) {
  if (Math.abs(delta.x) < 42 || Math.abs(delta.x) < Math.abs(delta.y) * 1.25) {
    return 0
  }
  return delta.x < 0 ? 1 : -1
}

/**
 * 以双指中点或单指拖动位置更新照片视图，限制平移范围
 *
 * @date 2026/11/24 14:44
 * @param view 当前缩放倍率及平移位置
 * @param from 上一时刻的手势中心，相对于视口中心
 * @param to 当前手势中心，相对于视口中心
 * @param ratio 手势距离相对上一时刻的倍率
 * @param viewport 全屏可用区域
 * @param image 未经变换的照片尺寸
 * @return 限位后的缩放倍率及平移位置
 */
export function transformPhoto(view: ZoomView, from: Point, to: Point, ratio: number, viewport: Size, image: Size): ZoomView {
  const scale = Math.min(4, Math.max(1, view.scale * ratio))
  if (scale === 1) {
    return initialZoom
  }
  const change = scale / view.scale
  const maxX = Math.max(0, (image.width * scale - viewport.width) / 2)
  const maxY = Math.max(0, (image.height * scale - viewport.height) / 2)
  const x = to.x - (from.x - view.x) * change
  const y = to.y - (from.y - view.y) * change

  return { scale, x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
}

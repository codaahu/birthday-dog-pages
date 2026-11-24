import { ref } from 'vue'

export interface ArtworkPoint { x: number; y: number }

/**
 * 以 SVG 自身坐标处理鼠标及触屏拖动
 *
 * @date 2026/11/24 11:45
 * @param artwork 包含图层的 SVG 根节点
 * @param commit 完成拖动时接收图层 ID 和最终坐标
 * @return 各阶段指针事件及临时显示坐标
 */
export function useArtworkDrag(artwork: () => SVGSVGElement | undefined, commit: (id: string, point: ArtworkPoint) => void) {
  const active = ref<{ id: string; point: ArtworkPoint }>()
  let gesture: { pointer: number; start: ArtworkPoint; origin: ArtworkPoint } | undefined

  /** 将屏幕坐标转换成插画坐标
   * @date 2026/11/24 11:45
   * @param event 浏览器提供的指针事件
   * @return 未挂载时返回 undefined
   */
  function locate(event: PointerEvent) {
    const svg = artwork()
    const transform = svg?.getScreenCTM()
    if (svg && transform) {
      const point = svg.createSVGPoint()
      point.x = event.clientX
      point.y = event.clientY
      return point.matrixTransform(transform.inverse())
    }
  }

  /** 记录拖动起点及图层原位置
   * @date 2026/11/24 11:45
   * @param event 按下图层的指针事件
   * @param id 被拖动图层
   * @param point 该图层的插画坐标
   */
  function start(event: PointerEvent, id: string, point: ArtworkPoint) {
    const start = locate(event)
    if (!start || gesture || event.button !== 0) {
      return
    }
    gesture = { pointer: event.pointerId, start, origin: point }
    active.value = { id, point }
    artwork()?.setPointerCapture(event.pointerId)
  }

  /** 更新拖动预览，保持指针相对图层的偏移
   * @date 2026/11/24 11:45
   * @param event 移动时的指针事件
   */
  function move(event: PointerEvent) {
    const next = locate(event)
    if (gesture?.pointer !== event.pointerId || !active.value || !next) {
      return
    }
    active.value = { id: active.value.id, point: {
      x: gesture.origin.x + next.x - gesture.start.x,
      y: gesture.origin.y + next.y - gesture.start.y,
    } }
  }

  /** 只在主动松开后记一次修改
   * @date 2026/11/24 11:45
   * @param event 松开或取消的指针事件
   */
  function end(event: PointerEvent) {
    if (gesture?.pointer !== event.pointerId) {
      return
    }
    if (event.type === 'pointerup') {
      move(event)
      if (active.value && Math.hypot(active.value.point.x - gesture.origin.x, active.value.point.y - gesture.origin.y) >= 2) {
        commit(active.value.id, active.value.point)
      }
    }
    gesture = undefined
    active.value = undefined
  }

  return { active, start, move, end }
}

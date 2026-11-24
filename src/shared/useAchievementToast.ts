import { onUnmounted, ref } from 'vue'
import type { AchievementId } from '../config/achievements'

export const achievementToastMs = 3000

/**
 * 依次显示已经成功写入存档的新成就
 *
 * @date 2026/11/24 13:54
 * @return 当前成就及用于加入提示的操作
 */
export function useAchievementToast() {
  const visible = ref<AchievementId>()
  const queue: AchievementId[] = []
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  onUnmounted(() => {
    disposed = true
    clearTimeout(timer)
    queue.length = 0
  })

  /**
   * 显示队列中的下一项，三秒后切到下一条
   *
   * @date 2026/11/24 13:54
   */
  function showNext() {
    const id = queue.shift()
    visible.value = id
    if (id) {
      timer = setTimeout(showNext, achievementToastMs)
    }
  }

  /**
   * 将本次新解锁的成就加入显示队列
   *
   * @date 2026/11/24 13:54
   * @param id 已成功保存的成就 ID
   */
  function notify(id: AchievementId) {
    if (disposed) {
      return
    }
    queue.push(id)
    if (!visible.value) {
      showNext()
    }
  }

  return { visible, notify }
}

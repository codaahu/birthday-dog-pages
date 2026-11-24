import { ref, shallowRef } from 'vue'
import type { Snapshot } from '../../core/storage/types'

/**
 * 管理不可变设计草稿与单步撤销，串行写入最新快照
 *
 * @date 2026/11/24 11:45
 * @param initial 初始设计快照
 * @param save 使用模块上下文保存草稿
 * @param snapshot 将设计与当前流程状态打包为存档对象
 * @return 编辑状态、撤销与保存控制
 */
export function useDesignDraft<T>(initial: T, save: (draft: Snapshot) => Promise<void>, snapshot: (design: T) => Snapshot) {
  const design = shallowRef(initial)
  const undoStack = shallowRef<T[]>([])
  const saveError = ref(false)
  let pending = Promise.resolve()

  /** 将当前草稿写入同一条队列
   * @date 2026/11/24 11:45
   * @return 本次写入结果，失败时允许重试
   */
  function checkpoint() {
    const next = snapshot(design.value)
    const result = pending.then(() => save(next))
    pending = result.then(() => { saveError.value = false }, (error) => {
      console.error('保存设计草稿失败', error)
      saveError.value = true
    })
    return result
  }

  /** 更新设计并记录一次撤销
   * @date 2026/11/24 11:45
   * @param next 新的设计快照
   */
  function edit(next: T) {
    if (next === design.value) {
      return
    }
    undoStack.value = [...undoStack.value.slice(-39), design.value]
    design.value = next
    void checkpoint()
  }

  /** 恢复上一次修改前的设计
   * @date 2026/11/24 11:45
   */
  function undo() {
    const previous = undoStack.value[undoStack.value.length - 1]
    if (previous === undefined) {
      return
    }
    design.value = previous
    undoStack.value = undoStack.value.slice(0, -1)
    void checkpoint()
  }

  /** 安装新作品草稿或已保存的作品
   * @date 2026/11/24 11:45
   * @param next 要安装的设计快照
   */
  function replace(next: T) {
    design.value = next
    undoStack.value = []
  }

  return { design, undoStack, saveError, checkpoint, edit, undo, replace }
}

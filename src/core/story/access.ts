import type { ModuleId, StoryStep } from '../../config/storyFlow'
import type { Profile, Run } from '../storage/types'

export const collectionModules = [
  'memory-room', 'flower-shop', 'cake-shop', 'catch-gifts', 'couple-quiz', 'gashapon', 'meeting',
] as const satisfies readonly ModuleId[]

/**
 * 根据持久化档案决定首次访问、剧情恢复和小屋权限
 *
 * @date 2026/11/24 10:54
 * @param requested 路由意图与模块 ID
 * @param profile 当前持久化档案
 * @param run 当前轮次或最近轮次
 * @return 当前允许的剧情步骤或收藏页
 */
export function resolveAccess(
  requested: { name: 'home' | 'story' | 'collection'; id?: string },
  profile: Profile,
  run?: Run,
): { name: 'story'; id: StoryStep } | { name: 'collection'; id?: ModuleId } {
  if (!profile.everCompleted) {
    return { name: 'story', id: run?.step ?? 'opening' }
  }

  if (requested.name === 'story' && run?.kind === 'replay' && run.status === 'active' && profile.activeRunId === run.id) {
    return { name: 'story', id: run.step }
  }

  const collectionModule = collectionModules.find((module) => module === requested.id)
  if (requested.name === 'collection' && collectionModule) {
    return { name: 'collection', id: collectionModule }
  }
  return { name: 'collection' }
}

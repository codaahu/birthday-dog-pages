import type { Mode, ModuleId } from '../../config/storyFlow'
import { emptyPhotos, photoCategories, type PhotoManifest } from '../../config/photos'
import type { Services } from '../storage'
import type { Run } from '../storage/types'
import type { CollectionSelection, ModuleContext } from './contract'

/**
 * 从小屋链接中读取作品或相册入口
 *
 * @date 2026/11/24 19:25
 * @param query 当前路由的查询参数
 * @return 独立玩法初始选择，未知值忽略
 */
export function collectionSelection(query: Record<string, unknown>): CollectionSelection {
  return {
    workId: typeof query.work === 'string' ? query.work : undefined,
    album: photoCategories.find((category) => category === query.album),
    puzzle: query.puzzle === '1',
  }
}

/**
 * 构造模块共享上下文，独立玩法不写主线草稿
 *
 * @date 2026/11/24 19:25
 * @param mode 模块运行模式
 * @param services 当前环境的存档服务
 * @param run 当前轮次，独立收藏模式省略
 * @param photos 当前可用的照片清单
 * @param now 测试场景的替代时钟，可省略
 * @param moduleId 当前模块，独立预览和主线进度不同时用于选取草稿
 * @param selection 从小屋进入相册、拼图或作品的可选初始目标
 * @return 供同一模块入口复用的参数与数据服务
 */
export function moduleContext(mode: Mode, services: Services, run?: Run, photos = emptyPhotos, now = Date.now(),
  moduleId: ModuleId | undefined = run?.step, selection?: CollectionSelection): ModuleContext {
  const runId = run?.id ?? null
  const step = moduleId === 'collection' ? undefined : moduleId
  return {
    mode, runId, replay: run?.kind === 'replay', now, photos,
    draft: step ? run?.drafts[step] : undefined,
    roundStatistics: step === 'ending' ? run?.statistics : undefined,
    collectionSelection: selection,
    data: {
      history: services.history,
      backup: moduleId === 'collection' ? services.backup : undefined,
      balance: () => services.rewards.balance(),
      draw: (commandId) => services.rewards.draw(commandId, runId),
      rewardShop: () => services.rewards.shop(runId),
      pendingDraw: () => services.rewards.pending(runId),
      revealDraw: (drawId) => services.rewards.reveal(drawId),
      redeemTicket: (ticketId, confirmed) => services.rewards.redeem(ticketId, confirmed),
      saveDraft: async (draft) => {
        if (run && step && mode !== 'collection') {
          await services.story.saveDraft(run.id, step, draft, mode === 'dev')
        }
      },
    },
  }
}

/**
 * 获取构建生成的照片清单，空清单允许继续预览
 *
 * @date 2026/11/24 10:54
 * @return 可用照片清单，资源无法加载时为空
 */
export async function loadPhotos(): Promise<PhotoManifest> {
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'photos/manifest.json')
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
      return emptyPhotos
    }
    return await response.json() as PhotoManifest
  } catch (error) {
    console.error('读取照片素材清单失败', error)
    return emptyPhotos
  }
}

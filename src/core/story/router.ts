import { createRouter, createWebHashHistory } from 'vue-router'
import { moduleIds } from '../../config/storyFlow'
import { services } from './runtime'
import { resolveAccess } from './access'
import StoryView from './StoryView.vue'
import StorageUnavailable from '../../shared/StorageUnavailable.vue'

/**
 * 注册正式路由以及仅开发环境加载的调试路由
 *
 * @date 2026/11/24 10:54
 * @return 完成访问守卫注册的 hash router
 */
export async function createBirthdayRouter() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', name: 'home', component: StoryView },
      { path: '/story/:moduleId', name: 'story', component: StoryView },
      { path: '/collection/:moduleId?', name: 'collection', component: StoryView },
      { path: '/storage-unavailable', name: 'storage-unavailable', component: StorageUnavailable },
      { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
    ],
  })

  if (import.meta.env.DEV) {
    const { devRoutes } = await import('../../dev/routes')
    for (const route of devRoutes) {
      router.addRoute(route)
    }
    router.beforeEach((to, from) => {
      if (to.name === 'home' && !from.name) {
        return { name: 'dev', replace: true }
      }
      if (to.name === 'dev-module' && !moduleIds.some((module) => module === to.params.moduleId)) {
        return { name: 'dev', replace: true }
      }
    })
  }

  router.beforeEach(async (to) => {
    if (to.name !== 'home' && to.name !== 'story' && to.name !== 'collection') {
      return
    }

    try {
      const { profile, run } = await services.story.session()
      const id = typeof to.params.moduleId === 'string' ? to.params.moduleId : undefined
      const allowed = resolveAccess({ name: to.name, id }, profile, run)
      if (allowed.name !== to.name || (allowed.id ?? '') !== (id ?? '')) {
        return { name: allowed.name, params: { moduleId: allowed.id ?? '' }, replace: true }
      }
    } catch (error) {
      console.error('检查冒险存档和路由失败', error)
      return { name: 'storage-unavailable', replace: true }
    }
  })
  return router
}

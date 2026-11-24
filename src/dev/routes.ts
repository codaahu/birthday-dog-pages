import type { RouteRecordRaw } from 'vue-router'

export const devRoutes: RouteRecordRaw[] = [
  { path: '/dev', name: 'dev', component: () => import('./DevHall.vue') },
  { path: '/dev/:moduleId', name: 'dev-module', component: () => import('./DevModule.vue') },
]

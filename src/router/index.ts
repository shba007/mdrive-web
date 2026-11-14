import { createRouter, createWebHistory } from 'vue-router'
import { useAccessStore } from '@/stores/access'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/projects' },
    {
      path: '/access',
      name: 'access',
      component: () => import('@/views/AccessView.vue'),
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { requiresAccess: true },
    },
    {
      path: '/projects/:projectId',
      name: 'project',
      component: () => import('@/views/ProjectView.vue'),
      meta: { requiresAccess: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/projects' },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAccess && !useAccessStore().isConfigured) return { name: 'access' }
  return true
})

export default router
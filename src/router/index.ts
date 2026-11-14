import { createRouter, createWebHistory } from 'vue-router'
import { useAccessStore } from '@/stores/access'
import { useSetupStore } from '@/stores/setup'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: () => (useSetupStore().onboarded ? '/projects' : '/setup') },
    {
      path: '/access',
      name: 'access',
      component: () => import('@/views/AccessView.vue'),
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/setup/ConnectStep.vue'),
    },
    {
      path: '/setup/storage',
      name: 'setup-storage',
      component: () => import('@/views/setup/StorageStep.vue'),
      meta: { requiresAccess: true },
    },
    {
      path: '/setup/storage/scope',
      name: 'setup-scope',
      component: () => import('@/views/setup/ScopeStep.vue'),
      meta: { requiresAccess: true, requiresPlan: true },
    },
    {
      path: '/setup/storage/review',
      name: 'setup-review',
      component: () => import('@/views/setup/ReviewStep.vue'),
      meta: { requiresAccess: true, requiresPlan: true },
    },
    {
      path: '/setup/storage/moving',
      name: 'setup-moving',
      component: () => import('@/views/setup/MovingStep.vue'),
      meta: { requiresAccess: true, requiresPlan: true },
    },
    {
      path: '/setup/done',
      name: 'setup-done',
      component: () => import('@/views/setup/DoneStep.vue'),
      meta: { requiresAccess: true },
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
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAccess && !useAccessStore().isConfigured) {
    // Inside setup, go back to its first step; elsewhere use the reconnect page.
    return to.path.startsWith('/setup') ? { name: 'setup' } : { name: 'access' }
  }
  if (to.meta.requiresPlan) {
    // Reached without a valid plan (e.g. after a reload): start over.
    if (useSetupStore().error()) return { name: 'setup-storage' }
  }
  return true
})

export default router
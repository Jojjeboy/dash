import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
  ],
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth to init if not already
  if (authStore.loading) {
    await authStore.initAuth()
  }

  const isPublic = to.name === 'login'
  const isAuthenticated = !!authStore.user

  if (!isPublic && !isAuthenticated) {
    next('/login')
  } else if (isPublic && isAuthenticated) {
    next('/dashboard') // Redirect to dashboard if already logged in and trying to access login
  } else {
    next()
  }
})

export default router

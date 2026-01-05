import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/search-results',
      name: 'search-results',
      component: () => import('../views/SearchResultsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-clips',
      name: 'my-clips',
      component: () => import('../views/MyClipsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/error',
      name: 'error',
      component: () => import('../views/ErrorView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/ErrorView.vue'),
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Check authentication status if we don't have user data
  if (!authStore.user) {
    await authStore.checkAuth()
  }

  // Redirect authenticated users away from guest pages
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/search')
    return
  }

  // Redirect unauthenticated users to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  next()
})

export default router

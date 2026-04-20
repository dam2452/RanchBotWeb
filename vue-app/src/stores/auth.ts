import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { isAxiosError } from 'axios'
import { authService } from '@/services/authService'
import type { User, LoginCredentials } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  async function login(credentials: LoginCredentials) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      if (response.success) {
        user.value = response.user
        return true
      }
      error.value = 'Invalid username or password'
      return false
    } catch (err: unknown) {
      error.value = isAxiosError(err) ? (err.response?.data?.detail || 'Invalid username or password') : 'Invalid username or password'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
    }
  }

  async function checkAuth() {
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        user.value = currentUser
        return true
      }
      user.value = null
      return false
    } catch (err) {
      user.value = null
      return false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  }
})

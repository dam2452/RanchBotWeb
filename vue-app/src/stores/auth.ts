import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiService } from '@/services/api'
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
      const response = await apiService.login(credentials)
      if (response.success) {
        user.value = response.user
        return true
      }
      error.value = 'Login failed'
      return false
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Invalid username or password'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await apiService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
    }
  }

  async function checkAuth() {
    try {
      const currentUser = await apiService.getCurrentUser()
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

  async function register(data: any) {
    loading.value = true
    error.value = null

    try {
      await apiService.register(data)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed'
      return false
    } finally {
      loading.value = false
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
    register,
  }
})

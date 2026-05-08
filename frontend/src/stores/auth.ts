import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { isAxiosError } from 'axios'
import { authService } from '@/services/authService'
import type { User, LoginCredentials, RegisterData } from '@/types'

const SUBSCRIPTION_KEY_ERROR_PREFIX = 'SUB_KEY:'

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
      if (isAxiosError(err)) {
        if (!err.response) {
          console.error('Login network error (no response):', err.message)
        } else {
          console.error('Login HTTP error:', err.response.status, err.response.data)
        }
        error.value = err.response?.data?.detail || 'Invalid username or password'
      } else {
        console.error('Login unexpected error:', err)
        error.value = 'Invalid username or password'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterData) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.register(data)
      if (response.success) {
        user.value = response.user

        if (data.subscriptionKey) {
          try {
            await authService.redeemKey(data.subscriptionKey)
          } catch (keyErr) {
            console.error('Subscription key redemption failed:', keyErr)
            error.value = `${SUBSCRIPTION_KEY_ERROR_PREFIX}Account created, but subscription key failed: ${keyErr instanceof Error ? keyErr.message : 'Unknown error'}`
          }
        }

        return true
      }
      error.value = 'Registration failed'
      return false
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail
        if (detail === 'telegram_linked') {
          error.value = 'This username is linked to a Telegram account. Use Telegram to log in.'
        } else if (detail === 'Username already taken') {
          error.value = 'Username is already taken'
        } else {
          error.value = detail || 'Registration failed'
        }
      } else {
        error.value = 'Registration failed'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword(username: string): Promise<string | null> {
    loading.value = true
    error.value = null

    try {
      const message = await authService.forgotPassword(username)
      return message
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        error.value = err.response?.data?.detail || 'Failed to send reset code'
      } else {
        error.value = 'Failed to send reset code'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(username: string, code: string, newPassword: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await authService.resetPassword(username, code, newPassword)
      return true
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        error.value = err.response?.data?.detail || 'Invalid or expired code'
      } else {
        error.value = 'Password reset failed'
      }
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
    register,
    forgotPassword,
    resetPassword,
    logout,
    checkAuth,
  }
})

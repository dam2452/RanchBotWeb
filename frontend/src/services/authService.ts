import { isAxiosError } from 'axios'
import { client, API_BASE } from './http'
import type { User, LoginCredentials, RegisterData } from '@/types'

class AuthService {
  private static _makeFormData(credentials: LoginCredentials): URLSearchParams {
    const params = new URLSearchParams()
    params.append('login', credentials.login)
    params.append('password', credentials.password)
    return params
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; success: boolean }> {
    const response = await client.post(
      `${API_BASE}/auth/login`,
      AuthService._makeFormData(credentials),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    if (response.data.status === 'success') {
      return { success: true, user: response.data.user }
    }

    throw new Error('Login failed')
  }

  async register(data: RegisterData): Promise<{ user: User; success: boolean }> {
    const response = await client.post(`${API_BASE}/auth/register`, {
      username: data.username,
      password: data.password,
      full_name: data.full_name || null,
    })

    if (response.data.status === 'success') {
      return { success: true, user: response.data.user }
    }

    throw new Error('Registration failed')
  }

  async forgotPassword(username: string): Promise<string> {
    const response = await client.post(`${API_BASE}/auth/forgot-password`, { username })
    return response.data.message ?? ''
  }

  async resetPassword(username: string, code: string, newPassword: string): Promise<string> {
    const response = await client.post(`${API_BASE}/auth/reset-password`, {
      username,
      code,
      new_password: newPassword,
    })
    return response.data.message ?? ''
  }

  async linkTelegram(): Promise<{ linking_code: string; message: string }> {
    const response = await client.post(`${API_BASE}/auth/link-telegram`)
    return {
      linking_code: response.data.linking_code,
      message: response.data.message,
    }
  }

  async logout(): Promise<void> {
    await client.get(`${API_BASE}/auth/logout`)
  }

  async logoutAll(
    credentials: LoginCredentials,
  ): Promise<{ message: string; revokedCount: number }> {
    const response = await client.post(
      `${API_BASE}/auth/logout-all`,
      AuthService._makeFormData(credentials),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    if (response.data.status === 'success') {
      return { message: response.data.message, revokedCount: response.data.revoked_count }
    }

    throw new Error('Failed to logout from all sessions')
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await client.get(`${API_BASE}/auth/user`)
      if (response.data.status === 'success') {
        return response.data.user
      }
      return null
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 401) {
        return null
      }
      throw err
    }
  }

  async getSubscription(): Promise<{ subscriptionEnd: string; daysRemaining: number }> {
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'sub', args: [] })

    if (response.data?.status === 'success' && response.data.data) {
      return {
        subscriptionEnd: response.data.data.subscription_end,
        daysRemaining: response.data.data.days_remaining,
      }
    }

    throw new Error('Failed to fetch subscription data')
  }

  async redeemKey(key: string): Promise<{ days: number }> {
    const response = await client.post(`${API_BASE}/auth/redeem-key`, { key })

    if (response.data?.data?.days) {
      return { days: response.data.data.days }
    }

    const detail = response.data?.detail || response.data?.content || 'Failed to redeem key'
    throw new Error(detail)
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<string> {
    const response = await client.post(`${API_BASE}/auth/change-password`, {
      old_password: oldPassword,
      new_password: newPassword,
    })

    return response.data?.message || 'Password changed successfully.'
  }
}

export const authService = new AuthService()

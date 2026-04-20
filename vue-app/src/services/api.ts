import axios, { isAxiosError, type AxiosInstance } from 'axios'
import type { User, Clip, SearchResult, LoginCredentials } from '@/types'

class ApiService {
  private _client: AxiosInstance

  constructor() {
    this._client = axios.create({
      baseURL: '/',
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    })

    this._client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status >= 500 && typeof window !== 'undefined') {
          window.location.href = '/error'
        }
        return Promise.reject(error)
      }
    )
  }

  private static _makeFormData(credentials: LoginCredentials): FormData {
    const formData = new FormData()
    formData.append('login', credentials.login)
    formData.append('password', credentials.password)
    return formData
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; success: boolean }> {
    const response = await this._client.post('/auth/login', ApiService._makeFormData(credentials), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (response.data.status === 'success') {
      return { success: true, user: response.data.user }
    }

    throw new Error('Login failed')
  }

  async logout(): Promise<void> {
    await this._client.get('/auth/logout')
  }

  async logoutAll(credentials: LoginCredentials): Promise<{ message: string; revokedCount: number }> {
    const response = await this._client.post('/auth/logout-all', ApiService._makeFormData(credentials), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (response.data.status === 'success') {
      return { message: response.data.message, revokedCount: response.data.revoked_count }
    }

    throw new Error('Failed to logout from all sessions')
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this._client.get('/auth/user')
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

  async searchClips(query: string): Promise<SearchResult[]> {
    const response = await this._client.post('/api/json', { endpoint: 'sz', args: [query] })

    if (response.data?.data?.results) {
      return response.data.data.results
    }

    throw new Error(`Unexpected response structure from search endpoint`)
  }

  async getVideo(index: string): Promise<Blob> {
    const response = await this._client.post(
      '/api/video',
      { endpoint: 'w', args: [index] },
      { responseType: 'blob' }
    )
    return response.data
  }

  async adjustVideo(clipIndex: string, leftAdjust: number, rightAdjust: number): Promise<Blob> {
    const response = await this._client.post(
      '/api/video',
      { endpoint: 'ad', args: [clipIndex, leftAdjust.toString(), rightAdjust.toString()] },
      { responseType: 'blob' }
    )
    return response.data
  }

  async getUserClips(): Promise<Clip[]> {
    const response = await this._client.get('/clips')

    if (response.data.status === 'success' && response.data.clips) {
      return response.data.clips
    }
    return []
  }

  async saveClip(clipName: string): Promise<void> {
    await this._client.post('/api/json', { endpoint: 'z', args: [clipName] })
  }

  async saveAdjustedClip(params: {
    clipId: number
    clipName: string
    leftAdjust: number
    rightAdjust: number
  }): Promise<void> {
    await this.adjustVideo(params.clipId.toString(), params.leftAdjust, params.rightAdjust)
    await this.saveClip(params.clipName)
  }

  async deleteClip(clipName: string): Promise<void> {
    await this._client.post('/api/json', { endpoint: 'uk', args: [clipName] })
  }

  getVideoUrl(clipId: string): string {
    return `/clips/video/${encodeURIComponent(clipId)}`
  }

  getThumbnailUrl(clipId: string): string {
    return `/clips/thumbnail/${encodeURIComponent(clipId)}`
  }

  async getThumbnail(clipPositionId: string, clipUniqueId?: string): Promise<Blob> {
    const payload: { endpoint: string; args: string[]; cacheKey?: string } = {
      endpoint: 'w',
      args: [clipPositionId],
    }

    if (clipUniqueId) {
      payload.cacheKey = clipUniqueId
    }

    const response = await this._client.post('/api/thumbnail', payload, { responseType: 'blob' })
    return response.data
  }

  async getSubscription(): Promise<{ subscriptionEnd: string; daysRemaining: number }> {
    const response = await this._client.post('/api/json', { endpoint: 'sub', args: [] })

    if (response.data?.status === 'success' && response.data.data) {
      return {
        subscriptionEnd: response.data.data.subscription_end,
        daysRemaining: response.data.data.days_remaining,
      }
    }

    throw new Error('Failed to fetch subscription data')
  }
}

export const apiService = new ApiService()

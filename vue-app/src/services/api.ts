import axios, { type AxiosInstance } from 'axios'
import type { User, Clip, SearchResult, LoginCredentials, ApiResponse } from '@/types'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for session cookies
    })
  }

  // Authentication - using FastAPI backend
  async login(credentials: LoginCredentials): Promise<{ user: User; success: boolean }> {
    const formData = new FormData()
    formData.append('login', credentials.login)
    formData.append('password', credentials.password)

    const response = await this.client.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    // FastAPI returns user data on success
    if (response.data.status === 'success') {
      return {
        success: true,
        user: response.data.user,
      }
    }

    throw new Error('Login failed')
  }

  async logout(): Promise<void> {
    await this.client.get('/auth/logout')
  }

  async register(data: any): Promise<void> {
    // Registration is disabled
    throw new Error('Registration is currently disabled')
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.client.get('/auth/user')
      if (response.data.status === 'success') {
        return response.data.user
      }
      return null
    } catch (err: any) {
      if (err.response?.status === 401) {
        return null
      }
      return null
    }
  }

  // Search
  async searchClips(query: string): Promise<SearchResult[]> {
    const response = await this.client.post('/api/json', {
      endpoint: 'sz',
      args: [query],
    })

    if (response.data && response.data.data && response.data.data.results) {
      return response.data.data.results
    }
    return []
  }

  // Video operations
  async getVideo(index: string): Promise<Blob> {
    const response = await this.client.post(
      '/api/video',
      {
        endpoint: 'w',
        args: [index],
      },
      {
        responseType: 'blob',
      }
    )
    return response.data
  }

  async adjustVideo(clipIndex: string, leftAdjust: number, rightAdjust: number): Promise<Blob> {
    const response = await this.client.post(
      '/api/video',
      {
        endpoint: 'd',
        args: [clipIndex, leftAdjust.toString(), rightAdjust.toString()],
      },
      {
        responseType: 'blob',
      }
    )
    return response.data
  }

  // Clips management
  async getUserClips(): Promise<Clip[]> {
    const response = await this.client.get('/clips?action=get_clips')

    if (response.data.status === 'success' && response.data.clips) {
      return response.data.clips
    }
    return []
  }

  async saveClip(clipName: string): Promise<void> {
    await this.client.post('/api/json', {
      endpoint: 'z',
      args: [clipName],
    })
  }

  async deleteClip(clipName: string): Promise<void> {
    await this.client.post('/api/json', {
      endpoint: 'uk',
      args: [clipName],
    })
  }

  getVideoUrl(clipId: string): string {
    return `/clips/video/${encodeURIComponent(clipId)}`
  }
}

export const apiService = new ApiService()

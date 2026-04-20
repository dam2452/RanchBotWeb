import { client } from './http'
import type { Clip, SearchResult } from '@/types'

class ClipService {
  async searchClips(query: string): Promise<SearchResult[]> {
    const response = await client.post('/api/json', { endpoint: 'sz', args: [query] })

    if (response.data?.data?.results) {
      return response.data.data.results
    }

    throw new Error('Unexpected response structure from search endpoint')
  }

  async getVideo(index: string): Promise<Blob> {
    const response = await client.post(
      '/api/video',
      { endpoint: 'w', args: [index] },
      { responseType: 'blob' }
    )
    return response.data
  }

  async adjustVideo(clipIndex: string, leftAdjust: number, rightAdjust: number): Promise<Blob> {
    const response = await client.post(
      '/api/video',
      { endpoint: 'ad', args: [clipIndex, leftAdjust.toString(), rightAdjust.toString()] },
      { responseType: 'blob' }
    )
    return response.data
  }

  async getUserClips(): Promise<Clip[]> {
    const response = await client.get('/clips')

    if (response.data.status === 'success' && response.data.clips) {
      return response.data.clips
    }
    return []
  }

  async saveClip(clipName: string): Promise<void> {
    await client.post('/api/json', { endpoint: 'z', args: [clipName] })
  }

  async deleteClip(clipName: string): Promise<void> {
    await client.post('/api/json', { endpoint: 'uk', args: [clipName] })
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

    const response = await client.post('/api/thumbnail', payload, { responseType: 'blob' })
    return response.data
  }
}

export const clipService = new ClipService()

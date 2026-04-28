import { client } from './http'
import {
  characterParser,
  emotionParser,
  episodeListParser,
  filterInfoParser,
  objectParser,
  searchResultsParser,
  seasonInfoParser
} from './clipParsers'
import type { ActiveFilters, Clip, EpisodeInfo, FilterOption, SearchResult, SeasonInfo } from '@/types'


class ClipService {
  async searchClips(query: string): Promise<SearchResult[]> {
    const response = await client.post('/api/json', { endpoint: 'szf', args: query ? [query] : [] })
    return searchResultsParser.parse(response.data)
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

  async getThumbnail(clipPositionId: string): Promise<Blob> {
    const response = await client.post(
      '/api/thumbnail',
      { endpoint: 'klatka', args: [clipPositionId, 'p'] },
      { responseType: 'blob' }
    )
    return response.data
  }

  async getCharacters(): Promise<FilterOption[]> {
    const response = await client.post('/api/json', { endpoint: 'p', args: [] })
    return characterParser.parse(response.data)
  }

  async getObjects(): Promise<FilterOption[]> {
    const response = await client.post('/api/json', { endpoint: 'obj', args: [] })
    return objectParser.parse(response.data)
  }

  async getEmotions(): Promise<FilterOption[]> {
    const response = await client.post('/api/json', { endpoint: 'e', args: [] })
    return emotionParser.parse(response.data)
  }

  async getSeasons(): Promise<SeasonInfo> {
    const response = await client.post('/api/json', { endpoint: 'odcinki', args: [] })
    return seasonInfoParser.parse(response.data)
  }

  async getEpisodes(season: string): Promise<EpisodeInfo[]> {
    const response = await client.post('/api/json', { endpoint: 'odcinki', args: [season] })
    return episodeListParser.parse(response.data)
  }

  async setFilters(filterString: string): Promise<void> {
    await client.post('/api/json', { endpoint: 'f', args: [filterString] })
  }

  async resetFilters(): Promise<void> {
    await client.post('/api/json', { endpoint: 'f', args: ['reset'] })
  }

  async getFilterInfo(): Promise<ActiveFilters | null> {
    const response = await client.post('/api/json', { endpoint: 'f', args: ['info'] })
    return filterInfoParser.parse(response.data)
  }
}

export const clipService = new ClipService()

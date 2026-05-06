import { fetchWithProgress } from '@/utils/formatters'
import { client } from './http'
import {
  characterParser,
  emotionParser,
  episodeListParser,
  filterInfoParser,
  objectParser,
  searchResultsParser,
  seasonInfoParser,
  seriesInfoParser
} from './clipParsers'
import type { SeriesInfo } from './clipParsers'
import type { ActiveFilters, Clip, EpisodeInfo, FilterOption, SearchResult, SeasonInfo } from '@/types'
import { ApiWarningError } from '@/types'


class ClipService {
  async searchClips(query: string): Promise<SearchResult[]> {
    const response = await client.post('/api/json', { endpoint: 'szf', args: query ? [query] : [] })
    return searchResultsParser.parse(response.data)
  }

  async searchSemanticClips(query: string): Promise<SearchResult[]> {
    const response = await client.post('/api/json', { endpoint: 'sensklatki', args: [query] })
    return searchResultsParser.parse(response.data)
  }

  async getVideo(index: string, onProgress?: (percent: number) => void): Promise<Blob> {
    if (!onProgress) {
      const response = await client.post('/api/video', { endpoint: 'w', args: [index] }, { responseType: 'blob' })
      return response.data
    }
    return fetchWithProgress(
      '/api/video',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ endpoint: 'w', args: [index] }),
      },
      onProgress,
    )
  }

  getVideoStreamUrl(positionId: string, searchId: number): string {
    return `/api/video/stream/${encodeURIComponent(positionId)}?s=${searchId}`
  }

  prefetchVideos(positionIds: string[]): void {
    if (positionIds.length === 0) return
    client.post('/api/prefetch', { position_ids: positionIds }).catch(() => {})
  }

  async adjustVideo(
    clipIndex: string,
    leftAdjust: number,
    rightAdjust: number,
    onProgress?: (percent: number) => void,
  ): Promise<Blob> {
    const body = { endpoint: 'ad', args: [clipIndex, leftAdjust.toString(), rightAdjust.toString()] }
    if (!onProgress) {
      const response = await client.post('/api/video', body, { responseType: 'blob' })
      return response.data
    }
    return fetchWithProgress(
      '/api/video',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      },
      onProgress,
    )
  }

  async getUserClips(allSeries = false): Promise<Clip[]> {
    const response = await client.get('/clips', { params: allSeries ? { all_series: true } : undefined })
    if (response.data.status === 'success' && response.data.clips) {
      return response.data.clips
    }
    return []
  }

  async saveClipByIndex(index: number, clipName: string, leftAdj?: number, rightAdj?: number): Promise<void> {
    const args = [index.toString()]
    if (leftAdj !== undefined && rightAdj !== undefined) {
      args.push(leftAdj.toString(), rightAdj.toString())
    }
    args.push(clipName)
    const response = await client.post('/api/json', { endpoint: 'zn', args })
    if (response.data?.status === 'error') {
      throw new Error(response.data?.message ?? 'Save failed')
    }
    if (response.data?.status === 'warning') {
      throw new ApiWarningError(response.data?.message ?? 'Warning')
    }
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

  async getSeries(): Promise<SeriesInfo> {
    const response = await client.post('/api/json', { endpoint: 'serial', args: [] })
    return seriesInfoParser.parse(response.data)
  }

  async setSeries(name: string): Promise<SeriesInfo> {
    const response = await client.post('/api/json', { endpoint: 'serial', args: [name] })
    return seriesInfoParser.parse(response.data)
  }
}

export const clipService = new ClipService()

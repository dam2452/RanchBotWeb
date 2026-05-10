import { fetchWithProgress } from '@/utils/formatters'
import { client, API_BASE } from './http'
import {
  characterParser,
  emotionParser,
  episodeListParser,
  filterInfoParser,
  objectParser,
  searchResultsParser,
  seasonInfoParser,
  seriesInfoParser,
} from './clipParsers'
import type { SeriesInfo } from './clipParsers'
import type { ActiveFilters, Clip, EpisodeInfo, FilterOption, SearchResult, SeasonInfo } from '@/types'
import { ApiWarningError } from '@/types'


export interface FilterOptionsBatch {
  characters?: FilterOption[]
  objects?: FilterOption[]
  emotions?: FilterOption[]
  seasons?: SeasonInfo
  series?: SeriesInfo
}


class ClipService {
  private _searchController: AbortController | null = null

  private _startSearch(): AbortSignal {
    this._searchController?.abort()
    this._searchController = new AbortController()
    return this._searchController.signal
  }

  async searchClips(query: string): Promise<SearchResult[]> {
    const signal = this._startSearch()
    const response = await client.post(
      `${API_BASE}/json`,
      { endpoint: 'szf', args: query ? [query] : [] },
      { signal },
    )
    return searchResultsParser.parse(response.data)
  }

  async searchSemanticClips(query: string): Promise<SearchResult[]> {
    const signal = this._startSearch()
    const response = await client.post(
      `${API_BASE}/json`,
      { endpoint: 'sensklatki', args: [query] },
      { signal },
    )
    return searchResultsParser.parse(response.data)
  }

  async getVideo(index: string, onProgress?: (percent: number) => void): Promise<Blob> {
    if (!onProgress) {
      const response = await client.post(
        `${API_BASE}/video`,
        { endpoint: 'w', args: [index] },
        { responseType: 'blob' },
      )
      return response.data
    }
    return fetchWithProgress(
      `${API_BASE}/video`,
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
    return `${API_BASE}/video/stream/${encodeURIComponent(positionId)}?s=${searchId}`
  }

  private _prefetchController: AbortController | null = null

  prefetchVideos(positionIds: string[], searchId: number): void {
    if (positionIds.length === 0) return
    this._prefetchController?.abort()
    this._prefetchController = new AbortController()
    client
      .post(`${API_BASE}/prefetch`, { position_ids: positionIds, search_id: searchId }, { signal: this._prefetchController.signal })
      .catch(() => {})
  }

  cancelPrefetch(): void {
    this._prefetchController?.abort()
    this._prefetchController = null
  }

  async adjustVideo(
    clipIndex: string,
    leftAdjust: number,
    rightAdjust: number,
    onProgress?: (percent: number) => void,
  ): Promise<Blob> {
    const body = { endpoint: 'ad', args: [clipIndex, leftAdjust.toString(), rightAdjust.toString()] }
    if (!onProgress) {
      const response = await client.post(`${API_BASE}/video`, body, { responseType: 'blob' })
      return response.data
    }
    return fetchWithProgress(
      `${API_BASE}/video`,
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
    const response = await client.get(`${API_BASE}/clips`, {
      params: allSeries ? { all_series: true } : undefined,
    })
    if (response.data.status === 'success' && response.data.clips) {
      return response.data.clips
    }
    return []
  }

  async saveClipByIndex(
    index: number,
    clipName: string,
    leftAdj?: number,
    rightAdj?: number,
  ): Promise<void> {
    const args = [index.toString()]
    if (leftAdj !== undefined && rightAdj !== undefined) {
      args.push(leftAdj.toString(), rightAdj.toString())
    }
    args.push(clipName)
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'zn', args })
    if (response.data?.status === 'error') {
      throw new Error(response.data?.message ?? 'Save failed')
    }
    if (response.data?.status === 'warning') {
      throw new ApiWarningError(response.data?.message ?? 'Warning')
    }
  }

  async deleteClip(clipName: string): Promise<void> {
    await client.post(`${API_BASE}/json`, { endpoint: 'uk', args: [clipName] })
  }

  getVideoUrl(clipId: string): string {
    return `${API_BASE}/clips/video/${encodeURIComponent(clipId)}`
  }

  getThumbnailUrl(clipId: string): string {
    return `${API_BASE}/clips/thumbnail/${encodeURIComponent(clipId)}`
  }

  async getThumbnail(clipPositionId: string): Promise<Blob> {
    const response = await client.post(
      `${API_BASE}/thumbnail`,
      { endpoint: 'klatka', args: [clipPositionId, 'p'] },
      { responseType: 'blob' },
    )
    return response.data
  }

  async getCharacters(): Promise<FilterOption[]> {
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'p', args: [] })
    return characterParser.parse(response.data)
  }

  async getObjects(): Promise<FilterOption[]> {
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'obj', args: [] })
    return objectParser.parse(response.data)
  }

  async getEmotions(): Promise<FilterOption[]> {
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'e', args: [] })
    return emotionParser.parse(response.data)
  }

  async getFilterOptionsBatch(includeFilters: boolean): Promise<FilterOptionsBatch> {
    const commands: Array<{ command: string; args: string[] }> = [
      { command: 'serial', args: [] },
    ]
    if (includeFilters) {
      commands.push(
        { command: 'p', args: [] },
        { command: 'obj', args: [] },
        { command: 'e', args: [] },
        { command: 'odcinki', args: [] },
      )
    }
    const response = await client.post(`${API_BASE}/batch`, { commands })
    const results = response.data.results as Array<{
      command: string
      index: number
      status: string
      response?: unknown
    }>

    const batch: FilterOptionsBatch = {}
    for (const result of results) {
      if (result.status !== 'success' || result.response == null) continue
      switch (result.command) {
        case 'p':
          batch.characters = characterParser.parse(result.response)
          break
        case 'obj':
          batch.objects = objectParser.parse(result.response)
          break
        case 'e':
          batch.emotions = emotionParser.parse(result.response)
          break
        case 'odcinki':
          batch.seasons = seasonInfoParser.parse(result.response)
          break
        case 'serial':
          batch.series = seriesInfoParser.parse(result.response)
          break
      }
    }
    return batch
  }

  async getSeasons(): Promise<SeasonInfo> {
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'odcinki', args: [] })
    return seasonInfoParser.parse(response.data)
  }

  async getEpisodes(season: string): Promise<EpisodeInfo[]> {
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'odcinki', args: [season] })
    return episodeListParser.parse(response.data)
  }

  async setFilters(filterString: string): Promise<void> {
    await client.post(`${API_BASE}/json`, { endpoint: 'f', args: [filterString] })
  }

  async resetFilters(): Promise<void> {
    await client.post(`${API_BASE}/json`, { endpoint: 'f', args: ['reset'] })
  }

  async getFilterInfo(): Promise<ActiveFilters | null> {
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'f', args: ['info'] })
    return filterInfoParser.parse(response.data)
  }

  async getSeries(): Promise<SeriesInfo> {
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'serial', args: [] })
    return seriesInfoParser.parse(response.data)
  }

  async setSeries(names: string[]): Promise<SeriesInfo> {
    const arg = names.length === 0 ? 'all' : names.join(',')
    const response = await client.post(`${API_BASE}/json`, { endpoint: 'serial', args: [arg] })
    return seriesInfoParser.parse(response.data)
  }
}

export const clipService = new ClipService()

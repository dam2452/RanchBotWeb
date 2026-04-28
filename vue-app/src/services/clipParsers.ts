import type { ActiveFilters, EpisodeInfo, FilterOption, SearchResult, SeasonInfo } from '@/types'


export interface ResponseParser<T> {
  parse(data: unknown): T
}

function _data(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid response')
  return (raw as Record<string, unknown>)
}

function _requireArray(obj: Record<string, unknown>, key: string): unknown[] {
  const arr = obj[key]
  if (!Array.isArray(arr)) throw new Error(`Expected array at key '${key}'`)
  return arr
}


class CharacterParser implements ResponseParser<FilterOption[]> {
  parse(data: unknown): FilterOption[] {
    const obj = _data(data)
    const inner = _data(obj.data)
    return _requireArray(inner, 'characters').map((item) => {
      const c = item as Record<string, unknown>
      return { name: c.name as string, episode_count: (c.episode_count as number) ?? 0 }
    })
  }
}

class ObjectParser implements ResponseParser<FilterOption[]> {
  parse(data: unknown): FilterOption[] {
    const obj = _data(data)
    const inner = _data(obj.data)
    return _requireArray(inner, 'objects').map((item) => {
      const o = item as Record<string, unknown>
      return { name: (o.class_name as string), scene_count: (o.scene_count as number) ?? 0 }
    })
  }
}

class EmotionParser implements ResponseParser<FilterOption[]> {
  parse(data: unknown): FilterOption[] {
    const obj = _data(data)
    const inner = _data(obj.data)
    return _requireArray(inner, 'emotions').map((item) => {
      const e = item as Record<string, unknown>
      return { name: e.label_pl as string, label: e.label_en as string }
    })
  }
}

export const characterParser = new CharacterParser()
export const objectParser = new ObjectParser()
export const emotionParser = new EmotionParser()


class SearchResultsParser implements ResponseParser<SearchResult[]> {
  parse(data: unknown): SearchResult[] {
    const obj = _data(data)
    const inner = _data(obj.data)
    if (!Array.isArray(inner.results)) throw new Error('Unexpected response structure from search endpoint')
    return inner.results as SearchResult[]
  }
}

export const searchResultsParser = new SearchResultsParser()


class SeasonInfoParser implements ResponseParser<SeasonInfo> {
  parse(data: unknown): SeasonInfo {
    const obj = _data(data)
    if (obj.season_info && typeof obj.season_info === 'object') return obj.season_info as SeasonInfo
    throw new Error('Missing season_info in response')
  }
}

class EpisodeListParser implements ResponseParser<EpisodeInfo[]> {
  parse(data: unknown): EpisodeInfo[] {
    const obj = _data(data)
    if (!Array.isArray(obj.episodes)) throw new Error('Missing episodes array in response')
    return obj.episodes.map((ep: unknown) => {
      const e = ep as Record<string, unknown>
      return { number: e.episode_number as number, title: e.title as string | undefined }
    })
  }
}

export const seasonInfoParser = new SeasonInfoParser()
export const episodeListParser = new EpisodeListParser()


class FilterInfoParser implements ResponseParser<ActiveFilters | null> {
  parse(data: unknown): ActiveFilters | null {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>
    const inner = obj.data
    if (!inner || typeof inner !== 'object') return null
    const filter = (inner as Record<string, unknown>).filter
    if (!filter || typeof filter !== 'object') return null
    return FilterInfoParser._mapToActiveFilters(filter as Record<string, unknown>)
  }

  private static _mapToActiveFilters(f: Record<string, unknown>): ActiveFilters {
    const seasons = Array.isArray(f.seasons) ? (f.seasons as number[]).map(String) : []
    const episodes = Array.isArray(f.episodes)
      ? (f.episodes as Array<Record<string, unknown>>).map(e => String(e.episode))
      : []
    const characters = Array.isArray(f.character_groups)
      ? (f.character_groups as string[][]).flat()
      : []
    const emotions = Array.isArray(f.emotions) ? (f.emotions as string[]) : []
    const objects = Array.isArray(f.object_groups)
      ? (f.object_groups as Array<Array<Record<string, unknown>>>).flat().map(o => o.name as string)
      : []
    return { season: seasons, episode: episodes, character: characters, emotion: emotions, object: objects }
  }
}

export const filterInfoParser = new FilterInfoParser()


export interface SeriesInfo {
  currentSeries: string
  availableSeries: string[]
}

class SeriesInfoParser implements ResponseParser<SeriesInfo> {
  parse(data: unknown): SeriesInfo {
    const obj = _data(data)
    const inner = _data(obj.data)
    return {
      currentSeries: inner.current_series as string,
      availableSeries: _requireArray(inner, 'available_series') as string[],
    }
  }
}

export const seriesInfoParser = new SeriesInfoParser()

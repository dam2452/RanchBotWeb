import type { EpisodeInfo, FilterOption, SearchResult, SeasonInfo } from '@/types'


// --- Internal helpers ---

function _normalize(message: string): string {
  return message.replace(/\u00A0/g, ' ')
}

const _CHAR_LINE = /👤\s+(.+)/
const _COUNT_LINE = /wystąpił w (\d+)/
const _EMOTION_LINE = /(\S+)\s+\((\S+)\)/
const _FILTER_KEY_LINE = /(Sezony|Odcinki|Postacie|Emocje|Obiekty|Tytuł):\s*(.+)/

const _FILTER_KEY_MAP: Record<string, string> = {
  Sezony: 'sezon',
  Odcinki: 'odcinek',
  Postacie: 'postac',
  Emocje: 'emocja',
  Obiekty: 'obiekt',
  Tytuł: 'tytul'
}

function _extractMessage(data: unknown): string {
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.message === 'string') return obj.message
  }
  return ''
}

function _tryParseJsonArray<T>(
  data: unknown,
  key: string,
  mapper: (item: Record<string, unknown>) => T
): T[] | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>
  const arr = obj[key]
  if (!Array.isArray(arr)) return null
  return arr.map((item: unknown) => mapper(item as Record<string, unknown>))
}


// --- Markdown parsers ---

function _parseCharacterMarkdown(message: string): FilterOption[] {
  const lines = _normalize(message).split('\n')
  const options: FilterOption[] = []
  for (let i = 0; i < lines.length; i++) {
    const nameMatch = lines[i]!.match(_CHAR_LINE)
    if (nameMatch && nameMatch[1]) {
      const countMatch = lines[i + 1]?.match(_COUNT_LINE)
      options.push({
        name: nameMatch[1].trim(),
        episode_count: countMatch && countMatch[1] ? parseInt(countMatch[1]) : 0
      })
    }
  }
  return options
}

function _parseObjectMarkdown(message: string): FilterOption[] {
  const lines = _normalize(message).split('\n')
  const options: FilterOption[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (!line || line.includes('🎬') || line.includes('INFO') || line.includes('Łącznie') || line.includes('👉') || line.startsWith('```')) continue
    const countMatch = lines[i + 1]?.match(_COUNT_LINE)
    if (countMatch && countMatch[1]) {
      const nameMatch = line.match(/^\S+\s+(.+)$/)
      if (nameMatch && nameMatch[1]) {
        options.push({ name: nameMatch[1].trim(), scene_count: parseInt(countMatch[1]) })
      }
    }
  }
  return options
}

function _parseEmotionMarkdown(message: string): FilterOption[] {
  const lines = _normalize(message).split('\n')
  const options: FilterOption[] = []
  for (const line of lines) {
    const match = line.match(_EMOTION_LINE)
    if (match && match[1] && match[2]) {
      options.push({ name: match[1], label: match[2] })
    }
  }
  return options
}

function _parseFilterInfoMarkdown(message: string): string {
  const parts: string[] = []
  for (const line of _normalize(message).split('\n')) {
    const match = line.match(_FILTER_KEY_LINE)
    if (match && match[1] && match[2]) {
      const key = _FILTER_KEY_MAP[match[1]]
      if (key) parts.push(`${key}:${match[2].trim()}`)
    }
  }
  return parts.join(' ')
}


// --- Parser interface ---

export interface ResponseParser<T> {
  parse(data: unknown): T
}


// --- Dual-format parser: try JSON array key, fallback to markdown ---

class DualFormatParser<T> implements ResponseParser<T[]> {
  constructor(
    private _jsonKey: string,
    private _jsonMapper: (item: Record<string, unknown>) => T,
    private _markdownParser: (message: string) => T[]
  ) {}

  parse(data: unknown): T[] {
    const jsonList = _tryParseJsonArray(data, this._jsonKey, this._jsonMapper)
    if (jsonList) return jsonList
    const message = _extractMessage(data)
    return message ? this._markdownParser(message) : []
  }
}


// --- Concrete filter parsers ---

export const characterParser = new DualFormatParser<FilterOption>(
  'characters',
  (c) => ({
    name: (c.name as string) || '',
    episode_count: (c.episode_count as number) || 0
  }),
  _parseCharacterMarkdown
)

export const objectParser = new DualFormatParser<FilterOption>(
  'objects',
  (c) => ({
    name: (c.class_name as string) || (c.name as string) || '',
    scene_count: (c.scene_count as number) || 0
  }),
  _parseObjectMarkdown
)

export const emotionParser = new DualFormatParser<FilterOption>(
  'emotions',
  (c) => ({
    name: (c.label_pl as string) || (c.name as string) || '',
    label: (c.label_en as string) || (c.label as string) || ''
  }),
  _parseEmotionMarkdown
)


// --- Search results parser ---

class SearchResultsParser implements ResponseParser<SearchResult[]> {
  parse(data: unknown): SearchResult[] {
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>
      if (obj.data && typeof obj.data === 'object') {
        const inner = obj.data as Record<string, unknown>
        if (Array.isArray(inner.results)) return inner.results as SearchResult[]
      }
    }
    throw new Error('Unexpected response structure from search endpoint')
  }
}

export const searchResultsParser = new SearchResultsParser()


// --- Season/Episode parsers ---

class SeasonInfoParser implements ResponseParser<SeasonInfo> {
  parse(data: unknown): SeasonInfo {
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>
      if (obj.season_info) return obj.season_info as SeasonInfo
    }
    return {}
  }
}

class EpisodeListParser implements ResponseParser<EpisodeInfo[]> {
  parse(data: unknown): EpisodeInfo[] {
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>
      const raw = obj.episodes
      if (Array.isArray(raw)) {
        return raw.map((ep: unknown) => {
          const e = ep as Record<string, unknown>
          return { number: e.episode_number as number, title: e.title as string | undefined }
        })
      }
    }
    return []
  }
}

export const seasonInfoParser = new SeasonInfoParser()
export const episodeListParser = new EpisodeListParser()


// --- Filter info parser ---

class FilterInfoParser implements ResponseParser<string> {
  parse(data: unknown): string {
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>
      if (obj.filters && typeof obj.filters === 'string') return obj.filters
    }
    const message = _extractMessage(data)
    if (message.includes('Brak aktywnych filtr')) return ''
    return _parseFilterInfoMarkdown(message)
  }
}

export const filterInfoParser = new FilterInfoParser()

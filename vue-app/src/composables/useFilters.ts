import { ref, computed } from 'vue'
import { clipService } from '@/services/clipService'
import type { FilterOption, SeasonInfo, EpisodeInfo, ActiveFilters } from '@/types'

const EMPTY_FILTERS: ActiveFilters = {
  season: [],
  episode: [],
  character: [],
  emotion: [],
  object: []
}

export function useFilters() {
  const characters = ref<FilterOption[]>([])
  const objects = ref<FilterOption[]>([])
  const emotions = ref<FilterOption[]>([])
  const seasons = ref<SeasonInfo>({})
  const episodes = ref<EpisodeInfo[]>([])

  const optionsLoading = ref(false)
  const applyLoading = ref(false)

  const selectedFilters = ref<ActiveFilters>({ ...EMPTY_FILTERS })
  const appliedFilters = ref<ActiveFilters>({ ...EMPTY_FILTERS })

  const hasActiveFilters = computed(() => {
    const f = appliedFilters.value
    return f.season.length > 0 || f.episode.length > 0 ||
      f.character.length > 0 || f.emotion.length > 0 || f.object.length > 0
  })

  const activeFilterCount = computed(() => {
    const f = appliedFilters.value
    let count = 0
    if (f.season.length) count++
    if (f.episode.length) count++
    if (f.character.length) count++
    if (f.emotion.length) count++
    if (f.object.length) count++
    return count
  })

  function buildFilterString(filters: ActiveFilters): string {
    const parts: string[] = []
    if (filters.season.length) parts.push(`sezon:${filters.season.join(',')}`)
    if (filters.episode.length) parts.push(`odcinek:${filters.episode.join(',')}`)
    if (filters.character.length) parts.push(`postac:${filters.character.join(',')}`)
    if (filters.emotion.length) parts.push(`emocja:${filters.emotion.join(',')}`)
    if (filters.object.length) parts.push(`obiekt:${filters.object.join(',')}`)
    return parts.join(' ')
  }

  function parseFilterString(raw: string): ActiveFilters {
    const result: ActiveFilters = { ...EMPTY_FILTERS }
    const tokens = raw.split(/\s+/)
    for (const token of tokens) {
      const colonIdx = token.indexOf(':')
      if (colonIdx === -1) continue
      const key = token.slice(0, colonIdx)
      const val = token.slice(colonIdx + 1)
      if (!val) continue
      const values = val.split(',')
      switch (key) {
        case 'sezon': case 's': result.season = values; break
        case 'odcinek': case 'ep': result.episode = values; break
        case 'postac': case 'p': result.character = values; break
        case 'emocja': case 'e': result.emotion = values; break
        case 'obiekt': case 'o': result.object = values; break
      }
    }
    return result
  }

  async function loadFilterOptions(): Promise<void> {
    if (optionsLoading.value) return
    optionsLoading.value = true
    try {
      const [chars, objs, emts, seass] = await Promise.all([
        clipService.getCharacters(),
        clipService.getObjects(),
        clipService.getEmotions(),
        clipService.getSeasons()
      ])
      characters.value = chars
      objects.value = objs
      emotions.value = emts
      seasons.value = seass
    } finally {
      optionsLoading.value = false
    }
  }

  async function loadEpisodes(season: string): Promise<void> {
    episodes.value = await clipService.getEpisodes(season)
  }

  async function applyFilters(): Promise<void> {
    const filterString = buildFilterString(selectedFilters.value)
    if (!filterString) {
      await resetFilters()
      return
    }
    applyLoading.value = true
    try {
      await clipService.setFilters(filterString)
      appliedFilters.value = { ...selectedFilters.value }
    } finally {
      applyLoading.value = false
    }
  }

  async function resetFilters(): Promise<void> {
    applyLoading.value = true
    try {
      await clipService.resetFilters()
      selectedFilters.value = { ...EMPTY_FILTERS }
      appliedFilters.value = { ...EMPTY_FILTERS }
    } finally {
      applyLoading.value = false
    }
  }

  async function fetchFilterInfo(): Promise<void> {
    const raw = await clipService.getFilterInfo()
    if (raw) {
      selectedFilters.value = parseFilterString(raw)
      appliedFilters.value = { ...selectedFilters.value }
    }
  }

  return {
    characters, objects, emotions, seasons, episodes,
    selectedFilters, appliedFilters,
    hasActiveFilters, activeFilterCount,
    optionsLoading, applyLoading,
    loadFilterOptions, loadEpisodes,
    applyFilters, resetFilters, fetchFilterInfo
  }
}

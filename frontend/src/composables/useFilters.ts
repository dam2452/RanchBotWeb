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

  const availableSeries = ref<string[]>([])
  const currentSeries = ref<string[]>([])
  const seriesLoading = ref(false)

  const optionsLoading = ref(false)
  const applyLoading = ref(false)

  const selectedFilters = ref<ActiveFilters>({ ...EMPTY_FILTERS })
  const appliedFilters = ref<ActiveFilters>({ ...EMPTY_FILTERS })

  const isSingleSeries = computed(() => currentSeries.value.length === 1)

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
    const _quoteIfNeeded = (value: string): string =>
      value.includes(' ') ? `"${value}"` : value

    const _buildValue = (values: string[]): string =>
      values.map(_quoteIfNeeded).join(',')

    const parts: string[] = []
    if (filters.season.length) parts.push(`sezon:${_buildValue(filters.season)}`)
    if (filters.episode.length) parts.push(`odcinek:${_buildValue(filters.episode)}`)
    if (filters.character.length) parts.push(`postac:${_buildValue(filters.character)}`)
    if (filters.emotion.length) parts.push(`emocja:${_buildValue(filters.emotion)}`)
    if (filters.object.length) parts.push(`obiekt:${_buildValue(filters.object)}`)
    return parts.join(' ')
  }

  async function loadFilterOptions(): Promise<void> {
    if (optionsLoading.value) return
    optionsLoading.value = true
    try {
      const batch = await clipService.getFilterOptionsBatch(true)
      if (batch.series) {
        availableSeries.value = batch.series.availableSeries
        currentSeries.value = batch.series.currentSeries
      }
      if (isSingleSeries.value) {
        if (batch.characters) characters.value = batch.characters
        if (batch.objects) objects.value = batch.objects
        if (batch.emotions) emotions.value = batch.emotions
        if (batch.seasons) seasons.value = batch.seasons
      }
    } finally {
      optionsLoading.value = false
    }
  }

  async function selectSeries(names: string[]): Promise<void> {
    if (seriesLoading.value) return
    seriesLoading.value = true
    try {
      const result = await clipService.setSeries(names)
      currentSeries.value = result.currentSeries
      characters.value = []
      objects.value = []
      emotions.value = []
      seasons.value = {}
      episodes.value = []
      selectedFilters.value = { ...EMPTY_FILTERS }
      appliedFilters.value = { ...EMPTY_FILTERS }
      await clipService.resetFilters()
    } finally {
      seriesLoading.value = false
    }
    if (names.length === 1) {
      await loadFilterOptions()
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
    const active = await clipService.getFilterInfo()
    if (active) {
      selectedFilters.value = active
      appliedFilters.value = { ...active }
    }
  }

  function toggleFilter(category: keyof ActiveFilters, value: string): void {
    const current = selectedFilters.value[category]
    if (category === 'season') {
      selectedFilters.value = {
        ...selectedFilters.value,
        season: current.includes(value) ? [] : [value]
      }
      if (!current.includes(value)) {
        loadEpisodes(value)
        selectedFilters.value.episode = []
      } else {
        episodes.value = []
        selectedFilters.value.episode = []
      }
    } else {
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      selectedFilters.value = { ...selectedFilters.value, [category]: updated }
    }
  }

  async function removeAppliedFilter(category: keyof ActiveFilters, value: string): Promise<void> {
    const updated = appliedFilters.value[category].filter(v => v !== value)
    const newFilters: ActiveFilters = { ...appliedFilters.value, [category]: updated }
    if (category === 'season') {
      newFilters.episode = []
      episodes.value = []
    }
    selectedFilters.value = { ...newFilters }
    appliedFilters.value = { ...newFilters }

    const filterString = buildFilterString(newFilters)
    if (filterString) {
      await clipService.setFilters(filterString)
    } else {
      await clipService.resetFilters()
    }
  }

  return {
    characters, objects, emotions, seasons, episodes,
    availableSeries, currentSeries, seriesLoading,
    isSingleSeries,
    selectedFilters, appliedFilters,
    hasActiveFilters, activeFilterCount,
    optionsLoading, applyLoading,
    loadFilterOptions, loadEpisodes,
    applyFilters, resetFilters, fetchFilterInfo,
    toggleFilter, removeAppliedFilter, selectSeries,
  }
}

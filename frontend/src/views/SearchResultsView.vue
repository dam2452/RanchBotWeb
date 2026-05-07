<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import { clipService } from '@/services/clipService'
import type { SearchResult, ActiveFilters } from '@/types'
import UserButtons from '@/components/layout/UserButtons.vue'
import SearchBar from '@/components/search/SearchBar.vue'
import FilterModal from '@/components/search/FilterModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import LogoHeader from '@/components/layout/LogoHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import VideoReel from '@/components/clips/VideoReel.vue'
import { useClipLoader } from '@/composables/useClipLoader'
import { useFilters } from '@/composables/useFilters'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { DESKTOP_BREAKPOINT, WATCH_BREAKPOINT } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const { windowWidth } = useWindowWidth()
const isWatchView = computed(() => windowWidth.value <= WATCH_BREAKPOINT)
const isDesktop = computed(() => windowWidth.value > DESKTOP_BREAKPOINT)

const _searchbarWidth = computed(() => Math.min(Math.max(280, windowWidth.value * 0.6), 720))
const _searchbarLeftEdge = computed(() => (windowWidth.value - _searchbarWidth.value) / 2)
const logoTextOverlapsSearchbar = computed(() => _searchbarLeftEdge.value < 420)

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')
const searchId = ref(0)
const showFilterModal = ref(false)
const semanticMode = computed(() => route.query.mode === 'semantic')

const {
  characters, objects, emotions, seasons, episodes,
  availableSeries, currentSeries, seriesLoading,
  selectedFilters, appliedFilters,
  hasActiveFilters, activeFilterCount,
  optionsLoading, applyLoading,
  loadFilterOptions, loadEpisodes,
  applyFilters, resetFilters, fetchFilterInfo,
  toggleFilter, removeAppliedFilter, selectSeries,
} = useFilters()

const { clips, loadedClips, loadingClips, loadNextClips, loadVideoForClip, revokeAll, reset, getLastLoadTime } = useClipLoader({
  results,
  searchId
})

onMounted(async () => {
  query.value = (route.query.query as string) || ''
  if (!semanticMode.value) {
    await fetchFilterInfo()
  }
  await _loadSearchResults()
})

onUnmounted(() => {
  revokeAll()
})

const _loadSearchResults = async (): Promise<void> => {
  if (semanticMode.value) {
    if (!query.value) return
  } else if (!query.value && !hasActiveFilters.value) {
    return
  }

  const capturedSearchId = searchId.value
  loading.value = true
  error.value = ''

  try {
    const newResults = semanticMode.value
      ? await clipService.searchSemanticClips(query.value)
      : await clipService.searchClips(query.value)

    if (searchId.value !== capturedSearchId) return

    results.value = newResults
    loading.value = false
    if (results.value.length > 0) {
      await loadNextClips(2)
    }
  } catch (err: unknown) {
    if (isAxiosError(err) && err.code === 'ERR_CANCELED') return
    error.value = err instanceof Error ? err.message : 'Failed to load search results'
    loading.value = false
  }
}

const _resetSearchState = (): void => {
  clipService.cancelPrefetch()
  searchId.value++
  reset()
  results.value = []
}

const handleSearch = (newQuery: string): void => {
  _resetSearchState()
  router.push({
    name: 'search-results',
    query: semanticMode.value ? { query: newQuery, mode: 'semantic' } : { query: newQuery },
  })
  query.value = newQuery
  _loadSearchResults()
}

const handleToggleSemantic = (currentInput: string): void => {
  const effectiveQuery = currentInput || query.value
  _resetSearchState()
  query.value = effectiveQuery
  const newMode = !semanticMode.value
  router.push({
    name: 'search-results',
    query: newMode ? { query: effectiveQuery, mode: 'semantic' } : { query: effectiveQuery },
  })
}

const handleFilters = (): void => {
  showFilterModal.value = true
  loadFilterOptions()
}

const handleFilterToggle = (category: keyof ActiveFilters, value: string): void => {
  toggleFilter(category, value)
}

const handleFilterRemove = async (category: keyof ActiveFilters, value: string): Promise<void> => {
  await removeAppliedFilter(category, value)
  _resetSearchState()
  _loadSearchResults()
}

const handleFilterApply = async (): Promise<void> => {
  await applyFilters()
  showFilterModal.value = false
}

const handleFilterReset = async (): Promise<void> => {
  await resetFilters()
  showFilterModal.value = false
  _resetSearchState()
  _loadSearchResults()
}

watch(() => route.query.mode, async () => {
  query.value = (route.query.query as string) || ''
  _resetSearchState()
  if (!semanticMode.value) {
    await fetchFilterInfo()
  }
  await _loadSearchResults()
})
</script>

<template>
  <button v-if="!isWatchView && !isDesktop" class="back-button" @click="router.back()">
    <svg class="back-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  </button>

  <UserButtons v-if="!isWatchView" fixed />
  <LogoHeader v-if="isDesktop" :hide-text="logoTextOverlapsSearchbar" />
  <AppFooter v-if="!isWatchView" />

  <main class="results-main">
    <div v-if="!isWatchView" class="search-bar-container">
      <SearchBar
        :initial-query="query"
        :active-filter-count="activeFilterCount"
        :applied-filters="appliedFilters"
        :allow-empty-search="hasActiveFilters"
        :semantic-mode="semanticMode"
        @search="handleSearch"
        @filters="handleFilters"
        @remove-filter="handleFilterRemove"
        @toggle-semantic="handleToggleSemantic"
      />
    </div>

    <FilterModal
      :show="showFilterModal"
      :selected-filters="selectedFilters"
      :seasons="seasons"
      :episodes="episodes"
      :characters="characters"
      :objects="objects"
      :emotions="emotions"
      :loading="optionsLoading"
      :apply-loading="applyLoading"
      :available-series="availableSeries"
      :current-series="currentSeries"
      :series-loading="seriesLoading"
      @close="showFilterModal = false"
      @applied="handleFilterApply"
      @toggle="handleFilterToggle"
      @remove="handleFilterToggle"
      @apply="handleFilterApply"
      @reset="handleFilterReset"
      @select-series="selectSeries"
    />

    <div v-if="loading || (results.length > 0 && !clips[0]?.thumbnailUrl && !clips[0]?.hasError)" class="loading-overlay">
      <LoadingSpinner message="Loading results..." />
    </div>

    <div v-else-if="error" class="error-overlay">{{ error }}</div>

    <div v-else-if="results.length === 0 && !loading" class="no-results-overlay">
      <template v-if="query">No results found for "{{ query }}"</template>
      <template v-else-if="semanticMode">Enter a query to search by image similarity</template>
      <template v-else>No results found for the selected filters</template>
    </div>

    <VideoReel
      v-if="!loading && (clips[0]?.thumbnailUrl || clips[0]?.hasError)"
      :clips="clips"
      :results="results"
      :loaded-clips="loadedClips"
      :loading-clips="loadingClips"
      :search-query="query"
      :is-watch-view="isWatchView"
      :get-last-load-time="getLastLoadTime"
      @load-more="loadNextClips()"
      @load-video="loadVideoForClip"
    />
  </main>
</template>

<style scoped lang="scss">
.results-main {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.search-bar-container {
  position: fixed;
  left: 50%;
  top: calc(5rem + env(safe-area-inset-top));
  transform: translateX(-50%);
  z-index: 1000;
  width: 95vw;
  max-width: 600px;

  @include mobile {
    width: 95vw;
    max-width: 660px;
  }

  @include tablet {
    width: clamp(280px, 60vw, 720px);
    max-width: 90vw;
  }

  @include desktop-up {
    top: calc(5.5rem + env(safe-area-inset-top));
  }

  @include large {
    top: calc(6.25rem + env(safe-area-inset-top));
  }
}

.loading-overlay,
.error-overlay,
.no-results-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 5;
}

.error-overlay {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #dc2626;
}

.no-results-overlay {
  font-size: clamp(1rem, 2vw, 1.25rem);
}

.back-button {
  position: fixed;
  top: calc(1.25rem + env(safe-area-inset-top));
  left: calc(1.25rem + env(safe-area-inset-left));
  z-index: 1015;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(36px, 5vw, 44px);
  height: clamp(36px, 5vw, 44px);
  background: linear-gradient(145deg, #aaaaaa, #999999);
  border: none;
  border-radius: 15px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;

  @include tablet-down {
    top: calc(0.9375rem + env(safe-area-inset-top));
    left: calc(0.9375rem + env(safe-area-inset-left));
  }

  @media (max-width: 400px) {
    width: 32px;
    height: 32px;
  }

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.back-chevron {
  width: 22px;
  height: 22px;
}
</style>

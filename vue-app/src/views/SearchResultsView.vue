<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')
const searchId = ref(0)
const showFilterModal = ref(false)

const {
  characters, objects, emotions, seasons, episodes,
  selectedFilters, appliedFilters,
  hasActiveFilters, activeFilterCount,
  optionsLoading, applyLoading,
  loadFilterOptions, loadEpisodes,
  applyFilters, resetFilters, fetchFilterInfo
} = useFilters()

const { clips, loadedClips, loadingClips, loadNextClips, loadVideoForClip, revokeAll, reset, getLastLoadTime } = useClipLoader({
  results,
  searchId
})

onMounted(async () => {
  query.value = (route.query.query as string) || ''
  await Promise.all([_loadSearchResults(), fetchFilterInfo()])
})

onUnmounted(() => {
  revokeAll()
})

const _loadSearchResults = async (): Promise<void> => {
  if (!query.value) return

  loading.value = true
  error.value = ''

  try {
    results.value = await clipService.searchClips(query.value)
    loading.value = false
    if (results.value.length > 0) {
      await loadNextClips(2)
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load search results'
    loading.value = false
  }
}

const _resetSearchState = (): void => {
  searchId.value++
  reset()
  results.value = []
}

const handleSearch = (newQuery: string): void => {
  _resetSearchState()
  router.push({ name: 'search-results', query: { query: newQuery } })
  query.value = newQuery
  _loadSearchResults()
}

const handleFilters = (): void => {
  showFilterModal.value = true
  loadFilterOptions()
}

const handleFilterToggle = (category: keyof ActiveFilters, value: string): void => {
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
      episodes.value.length = 0
      selectedFilters.value.episode = []
    }
  } else {
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    selectedFilters.value = { ...selectedFilters.value, [category]: updated }
  }
}

const handleFilterRemove = (category: keyof ActiveFilters, value: string): void => {
  const updated = appliedFilters.value[category].filter(v => v !== value)
  const newFilters = { ...appliedFilters.value, [category]: updated }
  selectedFilters.value = { ...newFilters }
  appliedFilters.value = { ...newFilters }

  const filterString = Object.entries(newFilters)
    .filter(([, v]) => v.length > 0)
    .map(([k, vals]) => {
      const keyMap: Record<string, string> = {
        season: 'sezon', episode: 'odcinek', character: 'postac',
        emotion: 'emocja', object: 'obiekt'
      }
      return `${keyMap[k]}:${vals.join(',')}`
    })
    .join(' ')

  if (filterString) {
    clipService.setFilters(filterString)
  } else {
    clipService.resetFilters()
  }

  _resetSearchState()
  _loadSearchResults()
}

const handleFilterSelectSeason = (season: string): void => {
  loadEpisodes(season)
}

const handleFilterApply = async (): Promise<void> => {
  await applyFilters()
  showFilterModal.value = false
  _resetSearchState()
  _loadSearchResults()
}

const handleFilterReset = async (): Promise<void> => {
  await resetFilters()
  showFilterModal.value = false
  _resetSearchState()
  _loadSearchResults()
}
</script>

<template>
  <button v-if="!isWatchView && !isDesktop" class="back-button" @click="router.back()">
    <svg class="back-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  </button>

  <UserButtons v-if="!isWatchView" fixed compact />
  <LogoHeader v-if="isDesktop" />
  <AppFooter v-if="!isWatchView" />

  <main class="results-main">
    <div v-if="!isWatchView" class="search-bar-container">
      <SearchBar
        :initial-query="query"
        :active-filter-count="activeFilterCount"
        :applied-filters="appliedFilters"
        @search="handleSearch"
        @filters="handleFilters"
        @remove-filter="handleFilterRemove"
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
      @close="showFilterModal = false"
      @applied="handleFilterApply"
      @toggle="handleFilterToggle"
      @remove="handleFilterToggle"
      @select-season="handleFilterSelectSeason"
      @apply="handleFilterApply"
      @reset="handleFilterReset"
    />

    <div v-if="loading || (results.length > 0 && !clips[0])" class="loading-overlay">
      <LoadingSpinner message="Loading results..." />
    </div>

    <div v-else-if="error" class="error-overlay">{{ error }}</div>

    <div v-else-if="results.length === 0 && !loading" class="no-results-overlay">
      No results found for "{{ query }}"
    </div>

    <VideoReel
      v-if="!loading && clips[0]"
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
  top: calc(80px + env(safe-area-inset-top));
  transform: translateX(-50%);
  z-index: 1000;
  width: 85vw;
  max-width: 500px;

  @include mobile {
    width: clamp(400px, 60vw, 550px);
  }

  @include tablet {
    width: clamp(280px, 60vw, 720px);
    max-width: 90vw;
  }

  @include desktop-up {
    top: calc(90px + env(safe-area-inset-top));
  }

  @include large {
    top: calc(100px + env(safe-area-inset-top));
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
  font-size: 20px;
  color: #dc2626;
}

.no-results-overlay {
  font-size: 20px;
}

.back-button {
  position: fixed;
  top: calc(20px + env(safe-area-inset-top));
  left: calc(20px + env(safe-area-inset-left));
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
    top: calc(15px + env(safe-area-inset-top));
    left: calc(15px + env(safe-area-inset-left));
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

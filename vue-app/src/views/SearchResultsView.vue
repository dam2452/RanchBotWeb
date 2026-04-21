<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clipService } from '@/services/clipService'
import type { SearchResult } from '@/types'
import UserButtons from '@/components/layout/UserButtons.vue'
import SearchBar from '@/components/search/SearchBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import LogoHeader from '@/components/layout/LogoHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import VideoReel from '@/components/clips/VideoReel.vue'
import { useClipLoader } from '@/composables/useClipLoader'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { DESKTOP_BREAKPOINT } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const { windowWidth } = useWindowWidth()
const isWatchView = computed(() => windowWidth.value <= 196)
const isDesktop = computed(() => windowWidth.value > DESKTOP_BREAKPOINT)

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')
const searchId = ref(0)

const { clips, loadedClips, loadingClips, loadNextClips, loadVideoForClip, revokeAll, reset, getLastLoadTime } = useClipLoader({
  results,
  searchId
})

onMounted(async () => {
  query.value = (route.query.query as string) || ''
  await _loadSearchResults()
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
  console.log('Filters clicked')
}
</script>

<template>
  <UserButtons v-if="!isWatchView" fixed />
  <LogoHeader v-if="isDesktop" />
  <AppFooter v-if="!isWatchView" />

  <main class="results-main">
    <div v-if="!isWatchView" class="search-bar-container">
      <SearchBar :initial-query="query" @search="handleSearch" @filters="handleFilters" />
    </div>

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
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.search-bar-container {
  position: fixed;
  left: 50%;
  top: 80px;
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
    top: 80px;
  }

  @include desktop-up {
    top: 90px;
  }

  @include large {
    top: 100px;
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
</style>

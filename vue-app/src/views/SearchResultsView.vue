<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiService } from '@/services/api'
import type { SearchResult } from '@/types'
import UserButtons from '@/components/UserButtons.vue'

const route = useRoute()
const router = useRouter()

const query = ref('')
const searchQuery = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')
const loadedClips = ref(0)
const videoCache = ref<{ [key: number]: string }>({})

const displayedResults = computed(() => results.value.slice(0, loadedClips.value + 3))

onMounted(async () => {
  query.value = (route.query.query as string) || ''
  searchQuery.value = query.value
  await loadSearchResults()
})

const loadSearchResults = async () => {
  if (!query.value) return

  loading.value = true
  error.value = ''

  try {
    results.value = await apiService.searchClips(query.value)
    if (results.value.length > 0) {
      await loadNextClips()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load search results'
  } finally {
    loading.value = false
  }
}

const loadNextClips = async (batchSize = 3) => {
  const startIdx = loadedClips.value
  const endIdx = Math.min(startIdx + batchSize, results.value.length)

  for (let i = startIdx; i < endIdx; i++) {
    try {
      const blob = await apiService.getVideo((i + 1).toString())
      const url = URL.createObjectURL(blob)
      videoCache.value[i] = url
    } catch (err) {
      console.error(`Failed to load clip ${i}:`, err)
    }
  }

  loadedClips.value = endIdx
}

const handleSearch = () => {
  const trimmedQuery = searchQuery.value.trim()
  if (!trimmedQuery) return

  router.push({
    name: 'search-results',
    query: { query: trimmedQuery },
  })

  query.value = trimmedQuery
  results.value = []
  loadedClips.value = 0
  videoCache.value = {}
  loadSearchResults()
}

const handleDownload = async (index: number) => {
  try {
    const blob = await apiService.getVideo((index + 1).toString())
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `video_${index + 1}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err: any) {
    alert('Download failed: ' + err.message)
  }
}

const handleLoadMore = () => {
  loadNextClips()
}
</script>

<template>
  <UserButtons fixed />
  <main class="search-results-page">
    <div class="search-header">
      <div class="logo-wrapper">
        <router-link to="/">
          <img src="/images/branding/logo.svg" class="logo-img" alt="RanchBot Logo" />
        </router-link>
        <h1 class="title">RanchBot</h1>
      </div>

      <div class="search-container">
        <input
          v-model="searchQuery"
          id="query-input"
          type="text"
          placeholder="Enter a quote"
          class="search-input"
          @keypress.enter="handleSearch"
        />
        <button class="search-icon-btn" @click="handleSearch" aria-label="Search">
          <img src="/images/ui/icons/arrow-circle-right.svg" alt="Search" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading results...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="results.length === 0 && !loading" class="no-results">
      No results found for "{{ query }}"
    </div>

    <div v-else class="video-reel">
      <div
        v-for="(result, index) in displayedResults"
        :key="index"
        class="reel-item"
        :data-idx="index"
      >
        <video
          v-if="videoCache[index]"
          loop
          preload="metadata"
          controls
          :src="videoCache[index]"
        ></video>
        <div v-else class="loading-placeholder">Loading video...</div>

        <button v-if="videoCache[index]" class="top-download-btn" @click="handleDownload(index)">
          Download
        </button>
      </div>

      <button
        v-if="loadedClips < results.length"
        class="load-more-btn"
        @click="handleLoadMore"
      >
        Load More
      </button>
    </div>
  </main>
</template>

<style scoped>
@import '@/assets/styles/css/pages/search-results.css';
@import '@/assets/styles/css/components/video-container.css';

.loading,
.error,
.no-results {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: red;
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: #f0f0f0;
}

.load-more-btn {
  margin: 2rem auto;
  display: block;
  padding: 1rem 2rem;
  font-size: 1rem;
  cursor: pointer;
}
</style>

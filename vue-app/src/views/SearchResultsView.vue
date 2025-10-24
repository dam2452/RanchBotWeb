<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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
const activeIndex = ref(0)
const videoReel = ref<HTMLElement | null>(null)

const displayedResults = computed(() => results.value.slice(0, loadedClips.value + 3))

onMounted(async () => {
  query.value = (route.query.query as string) || ''
  searchQuery.value = query.value
  await loadSearchResults()

  setTimeout(() => {
    if (videoReel.value) {
      const observer = new IntersectionObserver(
        (entries) => {
          let mostVisible: { entry: IntersectionObserverEntry; ratio: number } | null = null

          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!mostVisible || entry.intersectionRatio > mostVisible.ratio) {
                mostVisible = { entry, ratio: entry.intersectionRatio }
              }
            }
          })

          if (mostVisible && mostVisible.ratio > 0.5) {
            const index = parseInt((mostVisible.entry.target as HTMLElement).dataset.idx || '0')
            if (activeIndex.value !== index) {
              activeIndex.value = index
            }
          }
        },
        {
          threshold: [0, 0.25, 0.5, 0.75, 1],
          root: videoReel.value
        }
      )

      const items = videoReel.value.querySelectorAll('.reel-item')
      items.forEach((item) => observer.observe(item))
    }
  }, 100)
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
    if (videoCache.value[index]) {
      const a = document.createElement('a')
      a.href = videoCache.value[index]
      a.download = `ranchbot_clip_${index + 1}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      const blob = await apiService.getVideo((index + 1).toString())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ranchbot_clip_${index + 1}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  } catch (err: any) {
    console.error('Download failed:', err)
    alert('Download failed: ' + err.message)
  }
}

const handleLoadMore = () => {
  loadNextClips()
}

const scrollToClip = (index: number) => {
  if (!videoReel.value) return

  if (index === activeIndex.value) {
    return
  }

  activeIndex.value = index

  const items = videoReel.value.querySelectorAll('.reel-item')
  const targetItem = items[index] as HTMLElement

  if (targetItem) {
    targetItem.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }
}

const handleClipClick = (index: number, event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (target.tagName === 'VIDEO') {
    if (index === activeIndex.value) {
      const video = target as HTMLVideoElement
      if (video.paused) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    } else {
      scrollToClip(index)
    }
  } else if (target.classList.contains('adjust-btn') || target.classList.contains('download-btn')) {
    return
  } else {
    scrollToClip(index)
  }
}

const onVideoLoaded = (event: Event, index: number) => {
  const video = event.target as HTMLVideoElement
  if (index === activeIndex.value) {
    video.play().catch(() => {})
  }
}

watch(activeIndex, async (newIndex, oldIndex) => {
  if (!videoReel.value) return

  const items = videoReel.value.querySelectorAll('.reel-item video') as NodeListOf<HTMLVideoElement>

  items.forEach((video, index) => {
    if (index !== newIndex && !video.paused) {
      video.pause()
      video.currentTime = 0
    }
  })

  if (items[newIndex]) {
    try {
      if (items[newIndex].readyState >= 2) {
        await items[newIndex].play()
      }
    } catch (err) {
      console.log('Autoplay prevented')
    }
  }
})
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
        <button type="button" class="filter-btn">Filters</button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading results...</p>
    </div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="results.length === 0 && !loading" class="no-results">
      No results found for "{{ query }}"
    </div>

    <div v-else class="video-reel" ref="videoReel">
      <div
        v-for="(result, index) in displayedResults"
        :key="index"
        class="reel-item"
        :class="{ active: index === activeIndex }"
        :data-idx="index"
        @click="handleClipClick(index, $event)"
      >
        <video
          v-if="videoCache[index]"
          loop
          muted
          playsinline
          preload="auto"
          :src="videoCache[index]"
          @loadeddata="onVideoLoaded($event, index)"
        ></video>
        <div v-else class="loading-placeholder">Loading video...</div>

        <button v-if="videoCache[index]" class="adjust-btn" @click.stop>Adjust</button>
        <button v-if="videoCache[index]" class="download-btn" @click.stop="handleDownload(index)">Download</button>
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
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-size: 1.2rem;
  z-index: 5;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-bg-end, #ffb85c);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

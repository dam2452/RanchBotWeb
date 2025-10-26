<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiService } from '@/services/api'
import type { SearchResult } from '@/types'
import UserButtons from '@/components/UserButtons.vue'
import ClipInspector from '@/components/ClipInspector.vue'
import SearchBar from '@/components/SearchBar.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import VideoReelItem from '@/components/VideoReelItem.vue'
import LogoHeader from '@/components/LogoHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useHorizontalScroll } from '@/composables/useHorizontalScroll'

const route = useRoute()
const router = useRouter()

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')
const loadedClips = ref(0)
const videoCache = ref<{ [key: number]: string }>({})
const videoErrors = ref<{ [key: number]: boolean }>({})
const loadingClips = ref(false)
const activeIndex = ref(0)
const videoReel = ref<HTMLElement | null>(null)
const loadMoreElement = ref<HTMLElement | null>(null)
const inspectorVisible = ref(false)
const inspectorClipIndex = ref(0)
const inspectorClipUrl = ref('')

const totalClips = computed(() => {
  const hasLoadMore = loadedClips.value < results.value.length
  if (hasLoadMore && !loadingClips.value) {
    return displayedResults.value.length + 1
  }
  return displayedResults.value.length
})

const { setupScrollListeners, cleanupScrollListeners, handleItemClick, scrollTimeout, isManualScroll } = useHorizontalScroll({
  containerRef: videoReel,
  activeIndex,
  totalItems: totalClips,
  itemSelector: '.reel-item'
})

let loadMoreObserver: IntersectionObserver | null = null

const displayedResults = computed(() => {
  return results.value.slice(0, loadedClips.value)
})

onMounted(async () => {
  query.value = (route.query.query as string) || ''
  await loadSearchResults()
})

const setupLoadMoreObserver = () => {
  nextTick(() => {
    if (loadMoreElement.value && videoReel.value) {
      if (loadMoreObserver) {
        loadMoreObserver.disconnect()
      }

      loadMoreObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !loadingClips.value && loadedClips.value < results.value.length) {
              loadNextClips()
            }
          })
        },
        {
          root: videoReel.value,
          threshold: 0.5
        }
      )

      loadMoreObserver.observe(loadMoreElement.value)
    }
  })
}

onUnmounted(() => {
  cleanupScrollListeners()

  if (loadMoreObserver) {
    loadMoreObserver.disconnect()
  }

  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
})

const loadSearchResults = async () => {
  if (!query.value) return

  loading.value = true
  error.value = ''

  try {
    results.value = await apiService.searchClips(query.value)
    loading.value = false

    if (results.value.length > 0) {
      loadNextClips()
      setupLoadMoreObserver()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load search results'
    loading.value = false
  }
}

const loadNextClips = async (batchSize = 3) => {
  if (loadingClips.value) return

  loadingClips.value = true
  const startIdx = loadedClips.value
  const endIdx = Math.min(startIdx + batchSize, results.value.length)

  for (let i = startIdx; i < endIdx; i++) {
    const clipIndex = i
    try {
      const blob = await apiService.getVideo((clipIndex + 1).toString())
      const url = URL.createObjectURL(blob)
      videoCache.value[clipIndex] = url
      videoErrors.value[clipIndex] = false
      loadedClips.value = clipIndex + 1

      if (startIdx === 0 && clipIndex === 0) {
        await nextTick()
        setupScrollListeners()
        setupLoadMoreObserver()
        setTimeout(() => {
          scrollToClip(0)
        }, 50)
      }
    } catch (err) {
      console.error(`Failed to load clip ${clipIndex}:`, err)
      videoErrors.value[clipIndex] = true
      loadedClips.value = clipIndex + 1
    }
  }

  loadingClips.value = false

  if (loadedClips.value < results.value.length) {
    setupLoadMoreObserver()
  }
}

const handleSearch = (newQuery: string) => {
  router.push({
    name: 'search-results',
    query: { query: newQuery },
  })

  query.value = newQuery
  results.value = []
  loadedClips.value = 0
  videoCache.value = {}
  videoErrors.value = {}
  loadSearchResults()
}

const handleFilters = () => {
  console.log('Filters clicked')
}

const handleAdjust = (index: number) => {
  if (videoCache.value[index]) {
    inspectorClipIndex.value = index
    inspectorClipUrl.value = videoCache.value[index]
    inspectorVisible.value = true
  }
}

const closeInspector = () => {
  inspectorVisible.value = false
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

  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }

  isManualScroll.value = true
  activeIndex.value = index

  let targetItem: HTMLElement | null = null

  if (index === displayedResults.value.length && loadMoreElement.value) {
    targetItem = loadMoreElement.value
  } else {
    const items = videoReel.value.querySelectorAll('.reel-item:not(.load-more-item)')
    targetItem = items[index] as HTMLElement
  }

  if (targetItem) {
    const containerRect = videoReel.value.getBoundingClientRect()
    const itemRect = targetItem.getBoundingClientRect()
    const scrollLeft = videoReel.value.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) / 2

    videoReel.value.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })

    scrollTimeout.value = window.setTimeout(() => {
      isManualScroll.value = false
    }, 300)
  }
}

const handleClipClick = (index: number, event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (target.closest('.adjust-btn') || target.closest('.download-btn') || target.closest('button')) {
    return
  }

  if (index === activeIndex.value) {
    const video = (event.currentTarget as HTMLElement).querySelector('video')
    if (video) {
      if (video.paused) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }
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
      // Autoplay prevented - silent fail
    }
  }

  if (newIndex === loadedClips.value - 1 && loadedClips.value < results.value.length && !loadingClips.value) {
    loadNextClips()
  }
})
</script>

<template>
  <UserButtons fixed />
  <LogoHeader />
  <AppFooter />

  <main class="relative w-screen h-screen overflow-hidden m-0 p-0">
    <div class="search-bar-container fixed left-1/2 -translate-x-1/2 z-1000 w-[clamp(280px,60vw,720px)] max-w-[90vw] mt-20 max-[850px]:!w-[85vw] max-[850px]:!max-w-[500px] max-[480px]:!w-[85vw]" style="top: 100px;">
      <SearchBar :initial-query="query" @search="handleSearch" @filters="handleFilters" />
    </div>

    <div v-if="loading || (results.length > 0 && !videoCache[0] && !videoErrors[0])" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-5">
      <LoadingSpinner message="Loading results..." />
    </div>

    <div v-else-if="error" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xl z-5 text-red-600">{{ error }}</div>

    <div v-else-if="results.length === 0 && !loading" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xl z-5">
      No results found for "{{ query }}"
    </div>

    <div v-else-if="videoCache[0] || videoErrors[0]" class="scroll-smooth snap-x snap-mandatory overflow-x-scroll overflow-y-hidden flex items-center h-screen w-screen fixed top-0 left-0 m-0 p-0 pt-[140px] max-[850px]:flex-col max-[850px]:overflow-y-scroll max-[850px]:overflow-x-hidden max-[850px]:snap-y max-[850px]:pt-[195px]" ref="videoReel">
      <VideoReelItem
        v-for="(result, index) in displayedResults"
        :key="index"
        :index="index"
        :video-url="videoCache[index]"
        :has-error="videoErrors[index] || false"
        :is-active="index === activeIndex"
        @click="handleClipClick"
        @adjust="handleAdjust"
        @download="handleDownload"
        @loaded="onVideoLoaded"
      />

      <div
        v-if="loadedClips < results.length"
        ref="loadMoreElement"
        :data-idx="displayedResults.length"
        class="reel-item load-more-item clip-loaded snap-center transition-all duration-300 flex-shrink-0 opacity-50 scale-85 w-auto h-[55vh] min-w-auto max-w-none mx-5 p-0 relative flex items-center justify-center rounded-[32px] z-[1] max-[850px]:w-[90vw] max-[850px]:h-auto max-[850px]:max-w-[90vw] max-[850px]:my-2.5 max-[850px]:mx-0"
        :class="{
          'active z-[50] opacity-100 scale-100': activeIndex === displayedResults.length,
          'cursor-pointer': !loadingClips
        }"
        :style="[
          activeIndex === displayedResults.length ? 'box-shadow: 0 0 32px rgba(242, 169, 76, 0.8); border-radius: 32px;' : 'border-radius: 32px;',
          loadingClips ? 'pointer-events: none;' : ''
        ].join(' ')"
        @click="!loadingClips && handleLoadMore()"
      >
        <div
          v-if="loadingClips"
          class="w-auto h-full max-h-[55vh] object-contain rounded-[32px] block aspect-video scale-[0.99] max-[850px]:w-full max-[850px]:h-auto max-[850px]:max-h-none flex flex-col items-center justify-center bg-gray-100 pointer-events-none"
          :style="activeIndex === displayedResults.length ? 'box-shadow: 0 0 0 3px #f2a94c; box-sizing: border-box; border-radius: 32px;' : 'border-radius: 32px;'"
        >
          <LoadingSpinner size="small" message="Loading more clips..." />
        </div>
        <div
          v-else
          class="w-auto h-full max-h-[55vh] object-contain rounded-[32px] block cursor-pointer aspect-video scale-[0.99] max-[850px]:w-full max-[850px]:h-auto max-[850px]:max-h-none flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
          :style="activeIndex === displayedResults.length ? 'box-shadow: 0 0 0 3px #f2a94c; box-sizing: border-box; border-radius: 32px;' : 'border-radius: 32px;'"
        >
          <svg class="w-20 h-20 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <p class="text-gray-700 font-bold text-2xl mb-2">Load More</p>
          <p class="text-gray-500 text-sm">Scroll here or click to load</p>
          <p class="text-gray-400 text-xs mt-1">{{ results.length - loadedClips }} clips remaining</p>
        </div>
      </div>
    </div>
  </main>

  <ClipInspector
    :clip-index="inspectorClipIndex"
    :clip-url="inspectorClipUrl"
    :visible="inspectorVisible"
    @close="closeInspector"
  />
</template>

<style scoped>
.load-more-item.clip-loaded {
  animation: slideInFromRight 0.4s ease-out forwards;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(100px) scale(0.85);
  }
  to {
    opacity: 0.5;
    transform: translateX(0) scale(0.85);
  }
}

.load-more-item.clip-loaded.active {
  animation: slideInFromRightActive 0.4s ease-out forwards;
}

@keyframes slideInFromRightActive {
  from {
    opacity: 0;
    transform: translateX(100px) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
</style>

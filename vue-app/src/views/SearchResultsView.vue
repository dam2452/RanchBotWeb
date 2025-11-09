<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiService } from '@/services/api'
import type { SearchResult } from '@/types'
import UserButtons from '@/components/UserButtons.vue'
import SearchBar from '@/components/SearchBar.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import VideoReelItem from '@/components/VideoReelItem.vue'
import LogoHeader from '@/components/LogoHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useHorizontalScroll } from '@/composables/useHorizontalScroll'
import { useVideoControl } from '@/composables/useVideoControl'

const route = useRoute()
const router = useRouter()
const windowWidth = ref(window.innerWidth)

const isWatchView = computed(() => windowWidth.value <= 196)
const isDesktop = computed(() => windowWidth.value > 850)

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')
const loadedClips = ref(0)
const videoCache = ref<{ [key: number]: string }>({})
const thumbnailCache = ref<{ [key: number]: string }>({})
const videoErrors = ref<{ [key: number]: boolean }>({})
const loadingClips = ref(false)
const activeIndex = ref(0)
const videoReel = ref<HTMLElement | null>(null)
const loadMoreElement = ref<HTMLElement | null>(null)
const editingClipIndex = ref<number | null>(null)
const userUnmutedOnce = ref(false)
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

const { activeVideoId, userInteracted, pauseAllVideos, playVideoAtIndex, toggleVideoAtIndex } = useVideoControl({
  containerRef: videoReel,
  videoSelector: 'video'
})

const totalClips = computed(() => {
  const hasLoadMore = loadedClips.value < results.value.length
  if (hasLoadMore && !loadingClips.value) {
    return displayedResults.value.length + 1
  }
  return displayedResults.value.length
})

const { setupScrollListeners, cleanupScrollListeners, handleItemClick, scrollTimeout, isManualScroll, isScrolling } = useHorizontalScroll({
  containerRef: videoReel,
  activeIndex,
  totalItems: totalClips,
  itemSelector: '.reel-item',
  isLastItem: (index: number) => editingClipIndex.value === null && index === loadedClips.value - 1 && loadedClips.value < results.value.length,
  isEditing: () => editingClipIndex.value !== null
})

let loadMoreObserver: IntersectionObserver | null = null
let lastClipObserver: IntersectionObserver | null = null

const displayedResults = computed(() => {
  return results.value.slice(0, loadedClips.value)
})

let keydownTimeout: number | null = null
let canNavigate = true

const handleKeydown = (event: KeyboardEvent) => {
  if (!canNavigate) return
  if (editingClipIndex.value !== null) return

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()

    if (activeIndex.value === displayedResults.value.length && loadedClips.value < results.value.length) {
      loadNextClips()
      return
    }

    if (event.key === ' ' && activeIndex.value < displayedResults.value.length) {
      toggleVideoAtIndex(activeIndex.value)
    }
    return
  }

  if (event.key === 'ArrowLeft') {
    if (activeIndex.value > 0) {
      const videos = videoReel.value?.querySelectorAll('video') as NodeListOf<HTMLVideoElement>
      videos?.forEach(video => {
        if (!video.paused) {
          video.pause()
          video.currentTime = 0
        }
      })
      scrollToClip(activeIndex.value - 1)
      canNavigate = false
      setTimeout(() => {
        canNavigate = true
      }, 1000)
    }
  } else if (event.key === 'ArrowRight') {
    const videos = videoReel.value?.querySelectorAll('video') as NodeListOf<HTMLVideoElement>
    videos?.forEach(video => {
      if (!video.paused) {
        video.pause()
        video.currentTime = 0
      }
    })
    if (activeIndex.value < displayedResults.value.length - 1) {
      scrollToClip(activeIndex.value + 1)
      canNavigate = false
      setTimeout(() => {
        canNavigate = true
      }, 1000)
    } else if (activeIndex.value === displayedResults.value.length - 1 && loadedClips.value < results.value.length) {
      scrollToClip(displayedResults.value.length)
      canNavigate = false
      setTimeout(() => {
        canNavigate = true
      }, 1000)
    }
  }
}

let wheelTimeout: number | null = null
const handleWheel = (event: WheelEvent) => {
  if (!videoReel.value) return
  if (editingClipIndex.value !== null) return

  pauseAllVideos()

  if (wheelTimeout) {
    clearTimeout(wheelTimeout)
  }

  wheelTimeout = window.setTimeout(() => {
    if (event.deltaY > 0) {
      if (activeIndex.value < displayedResults.value.length - 1) {
        scrollToClip(activeIndex.value + 1)
      } else if (activeIndex.value === displayedResults.value.length - 1 && loadedClips.value < results.value.length) {
        scrollToClip(displayedResults.value.length)
      }
    } else if (event.deltaY < 0) {
      if (activeIndex.value > 0) {
        scrollToClip(activeIndex.value - 1)
      }
    }
  }, 50)
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(async () => {
  query.value = (route.query.query as string) || ''
  await loadSearchResults()
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)

  nextTick(() => {
    if (videoReel.value) {
      videoReel.value.addEventListener('wheel', handleWheel, { passive: true })
    }
  })
})

const setupLoadMoreObserver = () => {
  nextTick(() => {
    if (loadMoreElement.value && videoReel.value && !isMobile) {
      if (loadMoreObserver) {
        loadMoreObserver.disconnect()
      }

      loadMoreObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !loadingClips.value && loadedClips.value < results.value.length && !isManualScroll.value && editingClipIndex.value === null) {
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

    if (isMobile && videoReel.value && loadedClips.value < results.value.length) {
      if (lastClipObserver) {
        lastClipObserver.disconnect()
      }

      const lastClipIndex = loadedClips.value - 1
      const items = videoReel.value.querySelectorAll('.reel-item:not(.load-more-item)')
      const lastClipElement = items[lastClipIndex] as HTMLElement

      if (lastClipElement) {
        lastClipObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !loadingClips.value && loadedClips.value < results.value.length && editingClipIndex.value === null) {
                loadNextClips()
              }
            })
          },
          {
            root: videoReel.value,
            threshold: 0.3
          }
        )

        lastClipObserver.observe(lastClipElement)
      }
    }
  })
}

onUnmounted(() => {
  cleanupScrollListeners()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)

  if (videoReel.value) {
    videoReel.value.removeEventListener('wheel', handleWheel)
  }

  if (wheelTimeout) {
    clearTimeout(wheelTimeout)
  }

  if (loadMoreObserver) {
    loadMoreObserver.disconnect()
  }

  if (lastClipObserver) {
    lastClipObserver.disconnect()
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
      loadNextClips(2)
      setupLoadMoreObserver()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load search results'
    loading.value = false
  }
}

const loadNextClips = async (batchSize = 2) => {
  if (loadingClips.value) return

  loadingClips.value = true
  const startIdx = loadedClips.value
  const endIdx = Math.min(startIdx + batchSize, results.value.length)

  for (let i = startIdx; i < endIdx; i++) {
    const clipIndex = i
    const clipPositionId = (clipIndex + 1).toString()
    const clipResult = results.value[clipIndex]
    if (!clipResult) continue
    const clipUniqueId = clipResult.id

    try {
      console.log(`Loading clip ${clipIndex}:`, clipResult)
      console.log(`Loading thumbnail - Position: ${clipPositionId}, ID: ${clipUniqueId}, Type: ${typeof clipUniqueId}`)

      const thumbnailBlob = await apiService.getThumbnail(clipPositionId, String(clipUniqueId))
      const thumbnailUrl = URL.createObjectURL(thumbnailBlob)
      thumbnailCache.value[clipIndex] = thumbnailUrl
      videoErrors.value[clipIndex] = false

      const blob = await apiService.getVideo(clipPositionId)
      const url = URL.createObjectURL(blob)
      videoCache.value[clipIndex] = url
      loadedClips.value = clipIndex + 1

      if (startIdx === 0 && clipIndex === 0) {
        await nextTick()
        setupScrollListeners()
        setupLoadMoreObserver()
        setTimeout(() => {
          scrollToClip(0)
        }, 50)
      }
    } catch (err: any) {
      console.error(`Failed to load clip ${clipIndex}:`, err)
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text()
        console.error('Error details (parsed):', JSON.parse(text))
      } else {
        console.error('Error details:', err.response?.data)
      }
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
  thumbnailCache.value = {}
  videoErrors.value = {}
  loadSearchResults()
}

const handleFilters = () => {
  console.log('Filters clicked')
}

const handleAdjust = (index: number) => {
  if (editingClipIndex.value === index) {
    editingClipIndex.value = null
  } else {
    editingClipIndex.value = index
    activeIndex.value = index
    scrollToClip(index)
  }
}

const closeEditor = () => {
  editingClipIndex.value = null
}

const handleDownload = async (index: number) => {
  try {
    const { createClipFilename, downloadFile } = await import('@/utils/formatters')
    const filename = createClipFilename(index, 0, 0, query.value)

    if (videoCache.value[index]) {
      downloadFile(videoCache.value[index], filename)
    } else {
      const blob = await apiService.getVideo((index + 1).toString())
      const url = URL.createObjectURL(blob)
      downloadFile(url, filename)
      URL.revokeObjectURL(url)
    }
  } catch (err: any) {
    console.error('Download failed:', err)
  }
}

const handleSave = async (index: number) => {
  if (!query.value) {
    console.error('No search query to use as clip name')
    return
  }

  try {
    await apiService.adjustVideo((index + 1).toString(), 0, 0)
    await apiService.saveClip(query.value)
  } catch (err: any) {
    console.error('Save failed:', err)
  }
}

const handleLoadVideo = async (index: number) => {
  if (videoCache.value[index]) {
    const items = videoReel.value?.querySelectorAll('.reel-item video') as NodeListOf<HTMLVideoElement>
    if (items[index] && items[index].readyState >= 2) {
      items[index].play().catch(() => {})
    }
    return
  }

  const clipPositionId = (index + 1).toString()
  try {
    const blob = await apiService.getVideo(clipPositionId)
    const url = URL.createObjectURL(blob)
    videoCache.value[index] = url
  } catch (err) {
    console.error(`Failed to load video for clip ${index}:`, err)
    videoErrors.value[index] = true
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
    const isMobile = window.innerWidth <= 850
    const isEditing = editingClipIndex.value !== null
    const isFirstClipEditing = isEditing && index === 0
    const isLastLoaded = !isEditing && index === loadedClips.value - 1 && loadedClips.value < results.value.length

    if (isMobile) {
      let scrollTop
      if (isLastLoaded) {
        scrollTop = videoReel.value.scrollTop + (itemRect.top - containerRect.top) - 50
      } else {
        scrollTop = videoReel.value.scrollTop + (itemRect.top - containerRect.top) - (containerRect.height - itemRect.height) / 2
      }

      videoReel.value.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    } else {
      let scrollLeft
      if (isLastLoaded) {
        scrollLeft = videoReel.value.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) * 0.3
      } else if (isFirstClipEditing) {
        scrollLeft = videoReel.value.scrollLeft + (itemRect.left - containerRect.left) - 350
      } else {
        scrollLeft = videoReel.value.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) / 2
      }

      videoReel.value.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })
    }

    scrollTimeout.value = window.setTimeout(() => {
      isManualScroll.value = false
    }, 1000)
  }
}

const handleReelClick = (event: MouseEvent) => {
  if (!userInteracted.value) {
    userInteracted.value = true
  }

  if (editingClipIndex.value === null) return

  const target = event.target as HTMLElement

  if (!target.closest('.reel-item') || (!target.closest('.clip-video') && !target.closest('.edit-panel'))) {
    closeEditor()
  }
}

const handleClipClick = (index: number, event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (target.closest('.adjust-btn') || target.closest('.download-btn') || target.closest('button')) {
    return
  }

  if (editingClipIndex.value !== null && index !== editingClipIndex.value) {
    return
  }

  if (editingClipIndex.value !== null && index === editingClipIndex.value) {
    const video = (event.currentTarget as HTMLElement).querySelector('video')
    if (video) {
      if (video.paused) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }
    return
  }

  if (index === activeIndex.value) {
    const videos = videoReel.value?.querySelectorAll('.reel-item video') as NodeListOf<HTMLVideoElement>
    const video = (event.currentTarget as HTMLElement).querySelector('video')

    if (video) {
      if (video.paused) {
        videos.forEach((v, i) => {
          if (i !== index && !v.paused) {
            v.pause()
            v.currentTime = 0
          }
        })

        if (video.muted) {
          video.muted = false
          userUnmutedOnce.value = true
          userInteracted.value = true
        }
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }

    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
      scrollTimeout.value = null
    }
    isManualScroll.value = false
  } else {
    if (!userInteracted.value) {
      userInteracted.value = true
    }
    scrollToClip(index)
  }
}

const onVideoLoaded = (event: Event, index: number) => {
  // Video loaded, no autoplay
}

watch(activeIndex, async (newIndex, oldIndex) => {
  if (!videoReel.value) return
  if (newIndex === oldIndex) return

  if (editingClipIndex.value !== null && editingClipIndex.value !== newIndex) {
    editingClipIndex.value = null
  }

  pauseAllVideos()

  await nextTick()

  playVideoAtIndex(newIndex)
})
</script>

<template>
  <UserButtons v-if="!isWatchView" fixed />
  <LogoHeader v-if="isDesktop" />
  <AppFooter v-if="!isWatchView" />

  <main class="results-main">
    <div v-if="!isWatchView" class="search-bar-container">
      <SearchBar :initial-query="query" @search="handleSearch" @filters="handleFilters" />
    </div>

    <div v-if="loading || (results.length > 0 && !videoCache[0] && !thumbnailCache[0] && !videoErrors[0])" class="loading-overlay">
      <LoadingSpinner message="Loading results..." />
    </div>

    <div v-else-if="error" class="error-overlay">{{ error }}</div>

    <div v-else-if="results.length === 0 && !loading" class="no-results-overlay">
      No results found for "{{ query }}"
    </div>


    <div v-if="!loading && (videoCache[0] || thumbnailCache[0] || videoErrors[0])" class="video-reel" :class="{ 'watch-reel': isWatchView }" ref="videoReel" @click="handleReelClick">
      <VideoReelItem
        v-for="(result, index) in displayedResults"
        :key="index"
        :index="index"
        :video-url="videoCache[index]"
        :thumbnail-url="thumbnailCache[index]"
        :has-error="videoErrors[index] || false"
        :is-active="index === activeIndex"
        :is-last-loaded="index === loadedClips - 1 && loadedClips < results.length"
        :is-editing="index === editingClipIndex"
        :search-query="query"
        :user-unmuted="userUnmutedOnce"
        :user-interacted="userInteracted"
        @click="handleClipClick"
        @adjust="handleAdjust"
        @download="handleDownload"
        @save="handleSave"
        @loaded="onVideoLoaded"
        @close-editor="closeEditor"
        @load-video="handleLoadVideo"
      />

      <div
        v-if="loadedClips < results.length && !isWatchView"
        ref="loadMoreElement"
        :data-idx="displayedResults.length"
        class="reel-item load-more-item clip-loaded"
        :class="{
          'active': activeIndex === displayedResults.length,
          'clickable': !loadingClips,
          'loading-state': loadingClips
        }"
        @click="!loadingClips && handleLoadMore()"
      >
        <div v-if="loadingClips" class="load-more-content" :class="{ 'active-border': activeIndex === displayedResults.length }">
          <LoadingSpinner size="small" message="Loading more clips..." />
        </div>
        <div v-else class="load-more-content load-more-prompt" :class="{ 'active-border': activeIndex === displayedResults.length }">
          <svg class="load-more-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <p class="load-more-title">Load More</p>
          <p class="load-more-subtitle">Scroll here or click to load</p>
          <p class="load-more-count">{{ results.length - loadedClips }} clips remaining</p>
        </div>
      </div>

      <div v-if="!isWatchView" class="scroll-spacer"></div>
    </div>
  </main>

</template>

<style scoped>
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

.video-reel {
  scroll-behavior: smooth;
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.video-reel::-webkit-scrollbar {
  display: none;
}

.video-reel.watch-reel {
  padding: 0;
  justify-content: center;
}

.load-more-item {
  display: none;
}

.scroll-spacer {
  width: 100%;
  height: 50vh;
  flex-shrink: 0;
  pointer-events: none;
}



@media (min-width: 481px) {
  .search-bar-container {
    width: clamp(400px, 60vw, 550px);
  }
}

@media (min-width: 851px) {
  .search-bar-container {
    width: clamp(280px, 60vw, 720px);
    max-width: 90vw;
    top: 100px;
  }

  .video-reel {
    scroll-snap-type: x mandatory;
    overflow-x: scroll;
    overflow-y: hidden;
    flex-direction: row;
    padding: 140px 10vw 0 10vw;
  }

  .scroll-spacer {
    width: 50vw;
    height: 100%;
  }

  .video-reel.watch-reel {
    padding: 0;
  }

  .load-more-item {
    display: flex;
    width: auto;
    height: 55vh;
    max-width: none;
    margin: 0 20px;
    opacity: 0.5;
    transform: scale(0.85);
    border-radius: 32px;
    scroll-snap-align: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    padding: 0;
    position: relative;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .load-more-item.active {
    z-index: 50;
    opacity: 1;
    transform: scale(1);
  }

  .load-more-item.clickable {
    cursor: pointer;
  }

  .load-more-item.loading-state {
    pointer-events: none;
  }

  .load-more-content {
    width: auto;
    height: 100%;
    max-height: 55vh;
    object-fit: contain;
    border-radius: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    aspect-ratio: 16 / 9;
    transform: scale(0.99);
  }

  .load-more-content.active-border {
    box-shadow: 0 0 0 3px #f2a94c, 0 0 32px rgba(242, 169, 76, 0.8);
    box-sizing: border-box;
  }

  .load-more-prompt {
    background: linear-gradient(135deg, #fafafa, #f5f5f5);
    cursor: pointer;
  }

  .load-more-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 16px;
    color: #9ca3af;
  }

  .load-more-title {
    color: #374151;
    font-weight: bold;
    font-size: 24px;
    margin-bottom: 8px;
  }

  .load-more-subtitle {
    color: #6b7280;
    font-size: 14px;
  }

  .load-more-count {
    color: #9ca3af;
    font-size: 12px;
    margin-top: 4px;
  }
}
</style>

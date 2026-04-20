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
import { useClipLoader } from '@/composables/useClipLoader'
import { useLoadMoreObserver } from '@/composables/useLoadMoreObserver'
import { IS_MOBILE } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const windowWidth = ref(window.innerWidth)
const isWatchView = computed(() => windowWidth.value <= 196)
const isDesktop = computed(() => windowWidth.value > 850)

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')
const activeIndex = ref(0)
const searchId = ref(0)
const videoReel = ref<HTMLElement | null>(null)
const loadMoreElement = ref<HTMLElement | null>(null)
const editingClipIndex = ref<number | null>(null)
const userUnmutedOnce = ref(false)

const { userInteracted, pauseAllVideos, toggleVideoAtIndex } = useVideoControl({
  containerRef: videoReel,
  videoSelector: 'video'
})

const { clips, loadedClips, loadingClips, loadNextClips, loadVideoForClip, revokeAll, reset, getLastLoadTime } = useClipLoader({
  results,
  searchId
})

const displayedResults = computed(() => results.value.slice(0, loadedClips.value))

const totalClips = computed(() => {
  const hasLoadMore = loadedClips.value < results.value.length
  return hasLoadMore && !loadingClips.value
    ? displayedResults.value.length + 1
    : displayedResults.value.length
})

const { setupScrollListeners, cleanupScrollListeners, scrollToItem, scrollTimeout, isManualScroll } = useHorizontalScroll({
  containerRef: videoReel,
  activeIndex,
  totalItems: totalClips,
  itemSelector: '.reel-item',
  isLastItem: (index: number) => editingClipIndex.value === null && index === loadedClips.value - 1 && loadedClips.value < results.value.length,
  isEditing: () => editingClipIndex.value !== null
})

const observer = useLoadMoreObserver({
  containerRef: videoReel,
  loadMoreElementRef: loadMoreElement,
  loadedClips,
  results,
  loadingClips,
  isManualScroll,
  editingClipIndex,
  activeIndex,
  getLastLoadTime,
  onLoadMore: () => loadNextClips()
})

let firstClipInitialized = false

watch(loadedClips, async (count) => {
  if (count === 0) return

  if (!firstClipInitialized) {
    firstClipInitialized = true
    await nextTick()
    setupScrollListeners()
    observer.setup()
    setTimeout(() => scrollToItem(0), 50)
    return
  }

  if (loadedClips.value < results.value.length) {
    observer.setup()
  }
})

const handleResize = () => { windowWidth.value = window.innerWidth }

const handleSpaceEnter = (event: KeyboardEvent) => {
  if (editingClipIndex.value !== null) return
  if (event.key !== ' ' && event.key !== 'Enter') return

  event.preventDefault()

  if (activeIndex.value === displayedResults.value.length && loadedClips.value < results.value.length) {
    loadNextClips()
    return
  }

  if (event.key === ' ' && activeIndex.value < displayedResults.value.length) {
    toggleVideoAtIndex(activeIndex.value)
  }
}

onMounted(async () => {
  query.value = (route.query.query as string) || ''
  await loadSearchResults()
  window.addEventListener('keydown', handleSpaceEnter)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cleanupScrollListeners()
  observer.cleanup()
  revokeAll()
  window.removeEventListener('keydown', handleSpaceEnter)
  window.removeEventListener('resize', handleResize)

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
      await loadNextClips(2)
      observer.setup()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load search results'
    loading.value = false
  }
}

const resetSearchState = () => {
  searchId.value++
  reset()
  results.value = []
  activeIndex.value = 0
  editingClipIndex.value = null
  firstClipInitialized = false
}

const handleSearch = (newQuery: string) => {
  resetSearchState()
  router.push({ name: 'search-results', query: { query: newQuery } })
  query.value = newQuery
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
    scrollToItem(index)
  }
}

const closeEditor = () => {
  editingClipIndex.value = null
}

const handleLoadVideo = async (index: number) => {
  if (clips.value[index]?.videoUrl) {
    const videos = videoReel.value?.querySelectorAll('.reel-item video') as NodeListOf<HTMLVideoElement>
    const video = videos?.[index]
    if (video && video.readyState >= 2) {
      video.play().catch(() => {})
    }
    return
  }
  await loadVideoForClip(index)
}

const handleLoadMore = () => {
  loadNextClips()
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
    closeEditor()
    return
  }

  if (editingClipIndex.value !== null && index === editingClipIndex.value) {
    const video = (event.currentTarget as HTMLElement).querySelector('video')
    if (video) {
      video.paused ? video.play().catch(() => {}) : video.pause()
    }
    return
  }

  if (index === activeIndex.value) {
    const videos = videoReel.value?.querySelectorAll('.reel-item video') as NodeListOf<HTMLVideoElement>
    const video = (event.currentTarget as HTMLElement).querySelector('video')

    if (video) {
      if (video.paused) {
        videos?.forEach((v, i) => {
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
    userInteracted.value = true
    scrollToItem(index)
  }
}

watch(activeIndex, (newIndex, oldIndex) => {
  if (!videoReel.value || newIndex === oldIndex) return

  if (editingClipIndex.value !== null && editingClipIndex.value !== newIndex) {
    editingClipIndex.value = null
  }

  pauseAllVideos()

  if (IS_MOBILE && !loadingClips.value && editingClipIndex.value === null && newIndex >= loadedClips.value - 1 && loadedClips.value < results.value.length) {
    loadNextClips()
  }
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

    <div v-if="loading || (results.length > 0 && !clips[0])" class="loading-overlay">
      <LoadingSpinner message="Loading results..." />
    </div>

    <div v-else-if="error" class="error-overlay">{{ error }}</div>

    <div v-else-if="results.length === 0 && !loading" class="no-results-overlay">
      No results found for "{{ query }}"
    </div>


    <div v-if="!loading && clips[0]" class="video-reel" :class="{ 'watch-reel': isWatchView }" ref="videoReel" @click="handleReelClick">
      <VideoReelItem
        v-for="(result, index) in displayedResults"
        :key="index"
        :index="index"
        :video-url="clips[index]?.videoUrl"
        :thumbnail-url="clips[index]?.thumbnailUrl"
        :has-error="clips[index]?.hasError || false"
        :is-active="index === activeIndex"
        :is-last-loaded="index === loadedClips - 1 && loadedClips < results.length"
        :is-editing="index === editingClipIndex"
        :search-query="query"
        :user-unmuted="userUnmutedOnce"
        :user-interacted="userInteracted"
        @click="handleClipClick"
        @adjust="handleAdjust"
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

      <div v-if="loadedClips >= results.length && !isWatchView" class="end-of-clips">
        <svg class="end-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <p>That's all clips!</p>
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
  overscroll-behavior-y: auto;
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

.end-of-clips {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(242, 169, 76, 0.6);
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  width: 100%;
  flex-shrink: 0;
}

.end-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 12px;
  stroke-width: 2.5;
}

.end-of-clips p {
  margin: 0;
}

.scroll-spacer {
  width: 100%;
  height: 70vh;
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
    top: 80px;
  }

  .video-reel {
    scroll-snap-type: x mandatory;
    overflow-x: scroll;
    overflow-y: hidden;
    flex-direction: row;
    padding: 120px 10vw 0 10vw;
    overscroll-behavior-x: auto;
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

  .end-of-clips {
    height: 55vh;
    padding: 0 40px;
    margin: 0 20px;
    opacity: 0.5;
    transform: scale(0.85);
    scroll-snap-align: center;
  }

  .end-icon {
    width: 40px;
    height: 40px;
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

@media (min-width: 1200px) {
  .search-bar-container {
    top: 90px;
  }

  .video-reel {
    padding: 130px 10vw 0 10vw;
  }
}

@media (min-width: 1800px) {
  .search-bar-container {
    top: 100px;
  }

  .video-reel {
    padding: 140px 10vw 0 10vw;
  }
}
</style>

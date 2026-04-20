<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import VideoReelItem from './VideoReelItem.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { useVideoControl } from '@/composables/useVideoControl'
import { useHorizontalScroll } from '@/composables/useHorizontalScroll'
import { useLoadMoreObserver } from '@/composables/useLoadMoreObserver'
import { useVideoStore } from '@/stores/video'
import { IS_MOBILE } from '@/utils/formatters'
import type { SearchResult } from '@/types'
import type { ClipState } from '@/composables/useClipLoader'

interface Props {
  clips: Record<number, ClipState>
  results: SearchResult[]
  loadedClips: number
  loadingClips: boolean
  searchQuery: string
  isWatchView: boolean
  getLastLoadTime: () => number
}

interface Emits {
  (e: 'load-more'): void
  (e: 'load-video', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const videoReel = ref<HTMLElement | null>(null)
const loadMoreElement = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const editingClipIndex = ref<number | null>(null)

const loadedClipsRef = computed(() => props.loadedClips)
const resultsRef = computed(() => props.results)
const loadingClipsRef = computed(() => props.loadingClips)

const videoStore = useVideoStore()
const { pauseAllVideos, toggleVideoAtIndex } = useVideoControl({
  containerRef: videoReel,
  videoSelector: 'video'
})

const displayedResults = computed(() => props.results.slice(0, props.loadedClips))

const totalClips = computed(() => {
  const hasLoadMore = props.loadedClips < props.results.length
  return hasLoadMore && !props.loadingClips
    ? displayedResults.value.length + 1
    : displayedResults.value.length
})

const { setupScrollListeners, cleanupScrollListeners, scrollToItem, scrollTimeout, isManualScroll } = useHorizontalScroll({
  containerRef: videoReel,
  activeIndex,
  totalItems: totalClips,
  itemSelector: '.reel-item',
  isLastItem: (index: number) => editingClipIndex.value === null && index === props.loadedClips - 1 && props.loadedClips < props.results.length,
  isEditing: () => editingClipIndex.value !== null
})

const observer = useLoadMoreObserver({
  containerRef: videoReel,
  loadMoreElementRef: loadMoreElement,
  loadedClips: loadedClipsRef,
  results: resultsRef,
  loadingClips: loadingClipsRef,
  isManualScroll,
  editingClipIndex,
  activeIndex,
  getLastLoadTime: props.getLastLoadTime,
  onLoadMore: () => emit('load-more')
})

onMounted(() => {
  setupScrollListeners()
  observer.setup()
  setTimeout(() => scrollToItem(0), 50)
})

onUnmounted(() => {
  cleanupScrollListeners()
  observer.cleanup()
  if (scrollTimeout.value) clearTimeout(scrollTimeout.value)
  window.removeEventListener('keydown', _handleSpaceEnter)
})

watch(() => props.loadedClips, (count, prev) => {
  if (count > prev && count < props.results.length) {
    observer.setup()
  }
})

watch(activeIndex, (newIndex, oldIndex) => {
  if (!videoReel.value || newIndex === oldIndex) return

  if (editingClipIndex.value !== null && editingClipIndex.value !== newIndex) {
    editingClipIndex.value = null
  }

  pauseAllVideos()

  if (IS_MOBILE && !props.loadingClips && editingClipIndex.value === null && newIndex >= props.loadedClips - 1 && props.loadedClips < props.results.length) {
    emit('load-more')
  }
})

const _handleSpaceEnter = (event: KeyboardEvent): void => {
  if (editingClipIndex.value !== null) return
  if (event.key !== ' ' && event.key !== 'Enter') return

  event.preventDefault()

  if (activeIndex.value === displayedResults.value.length && props.loadedClips < props.results.length) {
    emit('load-more')
    return
  }

  if (event.key === ' ' && activeIndex.value < displayedResults.value.length) {
    toggleVideoAtIndex(activeIndex.value)
  }
}

window.addEventListener('keydown', _handleSpaceEnter)

const _handleReelClick = (event: MouseEvent): void => {
  videoStore.markInteracted()
  if (editingClipIndex.value === null) return

  const target = event.target as HTMLElement
  if (!target.closest('.reel-item') || (!target.closest('.clip-video') && !target.closest('.edit-panel'))) {
    editingClipIndex.value = null
  }
}

const _handleClipClick = (index: number, event: MouseEvent): void => {
  const target = event.target as HTMLElement
  if (target.closest('.adjust-btn') || target.closest('.download-btn') || target.closest('button')) return

  if (editingClipIndex.value !== null && index !== editingClipIndex.value) {
    editingClipIndex.value = null
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
        if (video.muted) video.muted = false
        videoStore.markInteracted()
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
    videoStore.markInteracted()
    scrollToItem(index)
  }
}

const _handleAdjust = (index: number): void => {
  if (editingClipIndex.value === index) {
    editingClipIndex.value = null
  } else {
    editingClipIndex.value = index
    activeIndex.value = index
    scrollToItem(index)
  }
}

const _handleLoadVideo = (index: number): void => {
  const clip = props.clips[index]
  if (clip?.videoUrl) {
    const videos = videoReel.value?.querySelectorAll('.reel-item video') as NodeListOf<HTMLVideoElement>
    const video = videos?.[index]
    if (video && video.readyState >= 2) {
      video.play().catch(() => {})
    }
    return
  }
  emit('load-video', index)
}
</script>

<template>
  <div
    class="video-reel"
    :class="{ 'watch-reel': isWatchView }"
    ref="videoReel"
    @click="_handleReelClick"
  >
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
      :search-query="searchQuery"
      @click="_handleClipClick"
      @adjust="_handleAdjust"
      @close-editor="editingClipIndex = null"
      @load-video="_handleLoadVideo"
      @pause-all="pauseAllVideos"
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
      @click="!loadingClips && emit('load-more')"
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
</template>

<style scoped>
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

@media (min-width: 851px) {
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
  .video-reel {
    padding: 130px 10vw 0 10vw;
  }
}

@media (min-width: 1800px) {
  .video-reel {
    padding: 140px 10vw 0 10vw;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import VideoReelItem from './VideoReelItem.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import { useVideoControl } from '@/composables/useVideoControl'
import { useHorizontalScroll } from '@/composables/useHorizontalScroll'
import { useLoadMoreObserver } from '@/composables/useLoadMoreObserver'
import { useReelInteraction } from '@/composables/useReelInteraction'
import { useReelKeyboard } from '@/composables/useReelKeyboard'
import { useVideoStore } from '@/stores/video'
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

const loadedClipsRef = computed(() => props.loadedClips)
const resultsRef = computed(() => props.results)
const loadingClipsRef = computed(() => props.loadingClips)
const displayedResults = computed(() => props.results.slice(0, props.loadedClips))
const resultsLength = computed(() => props.results.length)

const totalClips = computed(() => {
  const hasLoadMore = props.loadedClips < props.results.length
  return hasLoadMore && !props.loadingClips
    ? displayedResults.value.length + 1
    : displayedResults.value.length
})

const videoStore = useVideoStore()
const { pauseAllVideos, toggleVideoAtIndex } = useVideoControl({
  containerRef: videoReel,
  videoSelector: 'video'
})

const { setupScrollListeners, cleanupScrollListeners, scrollToItem, scrollTimeout, isManualScroll, bounceOffset, isBouncing } = useHorizontalScroll({
  containerRef: videoReel,
  activeIndex,
  totalItems: totalClips,
  itemSelector: '.reel-item',
  isLastItem: (index: number) => editingClipIndex.value === null && index === props.loadedClips - 1 && props.loadedClips < props.results.length,
  isEditing: () => editingClipIndex.value !== null
})

const {
  editingClipIndex,
  handleClipClick,
  handleAdjust,
  handleReelClick,
  handleLoadVideo,
  handleActiveIndexChange,
  closeEditor
} = useReelInteraction({
  videoReel,
  activeIndex,
  pauseAllVideos,
  scrollToItem,
  displayedCount: computed(() => displayedResults.value.length),
  loadedClips: loadedClipsRef,
  resultsLength,
  loadingClips: loadingClipsRef,
  scrollTimeout,
  isManualScroll,
  loadMore: () => emit('load-more'),
  loadVideo: (index: number) => emit('load-video', index)
})

useReelKeyboard({
  isEditing: editingClipIndex,
  activeIndex,
  displayedCount: computed(() => displayedResults.value.length),
  loadedClips: loadedClipsRef,
  resultsLength,
  toggleVideoAtIndex,
  loadMore: () => emit('load-more')
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
})

watch(() => props.loadedClips, (count, prev) => {
  if (count > prev && count < props.results.length) {
    observer.setup()
  }
})

watch(activeIndex, handleActiveIndexChange)
</script>

<template>
  <div
    class="video-reel"
    :class="{ 'watch-reel': isWatchView, 'bounce-back': isBouncing }"
    :style="{ '--bounce-y': `${bounceOffset}px` }"
    ref="videoReel"
    @click="handleReelClick"
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
      @click="handleClipClick"
      @adjust="handleAdjust"
      @close-editor="closeEditor"
      @load-video="handleLoadVideo"
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

<style scoped lang="scss">
.video-reel {
  scroll-behavior: smooth;
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
  transform: translateY(var(--bounce-y, 0px));

  &.bounce-back {
    transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  }

  &::-webkit-scrollbar {
    display: none;
  }

  &.watch-reel {
    padding: 0;
    justify-content: center;
  }

  @include tablet {
    scroll-snap-type: x mandatory;
    overflow-x: scroll;
    overflow-y: hidden;
    flex-direction: row;
    padding: calc(var(--layout-header-offset, 120px) + 0.5rem) 10vw 0 10vw;
    overscroll-behavior-x: auto;
  }
}

.load-more-item {
  display: none;

  @include tablet {
    display: flex;
    width: auto;
    height: calc(var(--layout-available-height, 55vh) - 1rem);
    max-height: 65vh;
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

    &.active {
      z-index: 50;
      opacity: 1;
      transform: scale(1);
    }

    &.clickable {
      cursor: pointer;
    }

    &.loading-state {
      pointer-events: none;
    }
  }
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

  p {
    margin: 0;
  }

  @include tablet {
    height: calc(var(--layout-available-height, 55vh) - 1rem);
    max-height: 65vh;
    padding: 0 40px;
    margin: 0 20px;
    opacity: 0.5;
    transform: scale(0.85);
    scroll-snap-align: center;
  }
}

.end-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 12px;
  stroke-width: 2.5;

  @include tablet {
    width: 40px;
    height: 40px;
  }
}

.scroll-spacer {
  width: 100%;
  height: 70vh;
  flex-shrink: 0;
  pointer-events: none;

  @include tablet {
    width: 50vw;
    height: 100%;
  }
}

.load-more-content {
  @include tablet {
    width: auto;
    height: 100%;
    max-height: calc(var(--layout-available-height, 55vh) - 1rem);
    object-fit: contain;
    border-radius: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    aspect-ratio: 16 / 9;
    transform: scale(0.99);

    &.active-border {
      box-shadow: 0 0 0 3px #f2a94c, 0 0 32px rgba(242, 169, 76, 0.8);
      box-sizing: border-box;
    }
  }
}

.load-more-prompt {
  @include tablet {
    background: linear-gradient(135deg, #fafafa, #f5f5f5);
    cursor: pointer;
  }
}

.load-more-icon {
  @include tablet {
    width: 80px;
    height: 80px;
    margin-bottom: 16px;
    color: #9ca3af;
  }
}

.load-more-title {
  @include tablet {
    color: #374151;
    font-weight: bold;
    font-size: 24px;
    margin-bottom: 8px;
  }
}

.load-more-subtitle {
  @include tablet {
    color: #6b7280;
    font-size: 14px;
  }
}

.load-more-count {
  @include tablet {
    color: #9ca3af;
    font-size: 12px;
    margin-top: 4px;
  }
}
</style>

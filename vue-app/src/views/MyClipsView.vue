<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
import { apiService } from '@/services/api'
import type { Clip } from '@/types'
import UserButtons from '@/components/UserButtons.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import LogoHeader from '@/components/LogoHeader.vue'
import MyClipCard from '@/components/MyClipCard.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useHorizontalScroll } from '@/composables/useHorizontalScroll'
import { useVideoControl } from '@/composables/useVideoControl'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { downloadFile } from '@/utils/formatters'

const clips = ref<Clip[]>([])
const loading = ref(true)
const error = ref('')
const activePage = ref(0)
const pageReel = ref<HTMLElement | null>(null)
const clipErrors = ref<{ [key: string]: boolean }>({})

const { activeVideoId, pauseAllVideos, toggleVideo } = useVideoControl({
  containerRef: pageReel,
  videoSelector: 'video.clip-video'
})

const { windowWidth } = useWindowWidth()
const isAppleWatch = computed(() => windowWidth.value <= 196)
const isMobile = computed(() => windowWidth.value <= 850)
const clipsPerPage = computed(() => isMobile.value ? 2 : 6)

const totalPages = computed(() => Math.ceil(clips.value.length / clipsPerPage.value))

const { setupScrollListeners, cleanupScrollListeners, scrollTimeout, isManualScroll } = useHorizontalScroll({
  containerRef: pageReel,
  activeIndex: activePage,
  totalItems: totalPages,
  itemSelector: '.page-item',
  enableKeyboard: false
})

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === ' ') {
    e.preventDefault()
    e.stopPropagation()

    if (activeVideoId.value) {
      toggleVideo(activeVideoId.value)
    }
    return
  }

  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    e.stopPropagation()
    const newIndex = Math.max(0, activePage.value - 1)
    scrollToPage(newIndex)
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    e.stopPropagation()
    const newIndex = Math.min(totalPages.value - 1, activePage.value + 1)
    scrollToPage(newIndex)
  }
}

onMounted(async () => {
  await loadClips()
  await nextTick()
  if (clips.value.length > 0) {
    setupScrollListeners()
    await nextTick()
    document.addEventListener('keydown', handleKeyDown, { capture: true })
    scrollToPage(0)
  }
})

onUnmounted(() => {
  cleanupScrollListeners()
  document.removeEventListener('keydown', handleKeyDown, { capture: true } as EventListenerOptions)
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
})

const scrollToPage = (index: number) => {
  if (!pageReel.value) return

  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }

  isManualScroll.value = true
  activePage.value = index

  const items = pageReel.value.querySelectorAll('.page-item')
  const targetItem = items[index] as HTMLElement

  if (targetItem) {
    targetItem.scrollIntoView({
      behavior: 'smooth',
      block: isMobile.value ? 'center' : 'nearest',
      inline: isMobile.value ? 'nearest' : 'center'
    })

    scrollTimeout.value = window.setTimeout(() => {
      isManualScroll.value = false
    }, 300)
  }
}

const handlePageClick = (pageIndex: number): void => {
  scrollToPage(pageIndex)
}

const loadClips = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    clips.value = await apiService.getUserClips()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load clips'
  } finally {
    loading.value = false
  }
}

const getClipsForPage = (pageIndex: number) => {
  const start = pageIndex * clipsPerPage.value
  const end = start + clipsPerPage.value
  return clips.value.slice(start, end)
}

const handleDelete = async (clipName: string): Promise<void> => {
  try {
    await apiService.deleteClip(clipName)
    clips.value = clips.value.filter((clip) => clip.name !== clipName)
  } catch (err: unknown) {
    console.error('Failed to delete clip:', err)
  }
}

const handleDownload = (clip: Clip): void => {
  downloadFile(apiService.getVideoUrl(clip.name), `${clip.name}.mp4`)
}

const getVideoUrl = (clipName: string) => {
  return apiService.getVideoUrl(clipName)
}

const getThumbnailUrl = (clipName: string) => {
  return apiService.getThumbnailUrl(clipName)
}

const handleVideoClick = (clip: Clip, event: Event) => {
  const activePageElement = pageReel.value?.querySelector('.page-item.active-page')
  if (!activePageElement) return

  const clipCards = activePageElement.querySelectorAll('.clip-card')
  let targetVideo: HTMLVideoElement | null = null

  for (const card of clipCards) {
    const video = card.querySelector('video') as HTMLVideoElement
    if (video && video.dataset.clipId === String(clip.id)) {
      targetVideo = video
      break
    }
  }

  if (!targetVideo) return

  if (activeVideoId.value === String(clip.id)) {
    if (targetVideo.paused) {
      targetVideo.play().catch(() => {})
    } else {
      targetVideo.pause()
    }
  } else {
    pauseAllVideos()
    activeVideoId.value = String(clip.id)

    if (targetVideo.readyState >= 2) {
      targetVideo.play().catch(() => {})
    }
  }
}

const handleVideoError = (clipId: string): void => {
  console.error('Video error for clip:', clipId)
  clipErrors.value = { ...clipErrors.value, [clipId]: true }
}

watch(activePage, pauseAllVideos)
</script>

<template>
  <UserButtons fixed :show-my-clips="false" />
  <LogoHeader v-if="!isMobile" />
  <AppFooter />

  <button
    v-if="!isAppleWatch && !loading && !error && clips.length > 0"
    class="search-button"
    @click="$router.push('/search')"
  >
    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="10" cy="10" r="7"></circle>
      <path d="M15 15 L21 21"></path>
    </svg>
    Search
  </button>

  <main class="main-container">
    <div v-if="isAppleWatch" class="center-message">
      <p class="message-text">My Clips feature is not available on Apple Watch. Please use a larger device.</p>
    </div>

    <div v-else-if="loading" class="center-message">
      <LoadingSpinner message="Loading clips..." />
    </div>

    <div v-else-if="error" class="center-message">
      <p class="message-text error-text">{{ error }}</p>
    </div>

    <div v-else-if="clips.length === 0" class="center-message">
      <p class="message-text">You don't have any clips yet. Use the quote search to create your first clips!</p>
    </div>

    <div
      v-else
      ref="pageReel"
      class="page-reel"
    >
      <div
        v-for="pageIndex in totalPages"
        :key="`page-${pageIndex}`"
        :data-page-idx="pageIndex - 1"
        class="page-item"
        :class="{ 'active-page': activePage === pageIndex - 1 }"
        @click="handlePageClick(pageIndex - 1)"
      >
        <div class="clips-grid">
          <MyClipCard
            v-for="clip in getClipsForPage(pageIndex - 1)"
            :key="clip.id"
            :clip="clip"
            :video-url="getVideoUrl(clip.name)"
            :thumbnail-url="getThumbnailUrl(clip.name)"
            :is-active="activeVideoId === String(clip.id)"
            :has-error="!!clipErrors[clip.id]"
            @video-click="(e) => handleVideoClick(clip, e)"
            @download="handleDownload(clip)"
            @delete="handleDelete(clip.name)"
            @video-error="handleVideoError(clip.id)"
          />
        </div>
      </div>

      <div v-if="!isAppleWatch" class="scroll-spacer"></div>
    </div>
  </main>
</template>

<style scoped>
.main-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.center-message {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1.25rem;
}

.message-text {
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  font-weight: bold;
  max-width: 600px;
}

.error-text {
  color: #ef4444;
}

.page-reel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 140px 0 60px 0;
  align-items: flex-start;
}

.page-reel::-webkit-scrollbar {
  display: none;
}

.page-item {
  scroll-snap-align: center;
  transition: all 0.3s;
  flex-shrink: 0;
  opacity: 1;
  transform: scale(1);
  width: 100%;
  height: auto;
  margin: 1rem 0;
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  pointer-events: none;
}

.page-item.active-page {
  opacity: 1;
  transform: scale(1);
  z-index: 50;
  pointer-events: auto;
}

.clips-grid {
  width: 85vw;
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0;
  background: transparent;
  backdrop-filter: none;
}

.scroll-spacer {
  width: 100%;
  height: 50vh;
  flex-shrink: 0;
  pointer-events: none;
}

@media (min-width: 851px) {
  .page-reel {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    padding: 0 10vw;
    align-items: center;
  }

  .scroll-spacer {
    width: 50vw;
    height: 100%;
  }

  .page-item {
    width: auto;
    height: 100%;
    min-width: auto;
    max-width: none;
    margin: 0 2rem;
    pointer-events: auto;
  }

  .page-item:not(.active-page) {
    opacity: 0.5;
    transform: scale(0.9);
    pointer-events: auto;
  }

  .clips-grid {
    width: 70vw;
    height: 70vh;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 1.5rem;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 32px;
    backdrop-filter: blur(8px);
  }

  .clips-grid:has(> :nth-child(1):nth-last-child(1)),
  .clips-grid:has(> :nth-child(1):nth-last-child(2)),
  .clips-grid:has(> :nth-child(1):nth-last-child(3)),
  .clips-grid:has(> :nth-child(1):nth-last-child(4)),
  .clips-grid:has(> :nth-child(1):nth-last-child(5)) {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    justify-items: center;
    align-items: center;
  }

  .clips-grid:has(> :nth-child(1):nth-last-child(1)),
  .clips-grid:has(> :nth-child(1):nth-last-child(2)),
  .clips-grid:has(> :nth-child(1):nth-last-child(3)) {
    grid-template-rows: 1fr;
  }
}

@media (min-width: 851px) and (max-width: 1200px) {
  .clips-grid {
    width: 80vw;
  }
}

.search-button {
  position: fixed;
  top: calc(80px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  background: linear-gradient(145deg, #f2a94c, #e09340);
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 15px;
  padding: 8px 16px;
  font-size: 15px;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  width: fit-content;
}

.search-button:hover {
  transform: translateX(-50%) scale(1.05);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.4);
}

.search-button:active {
  transform: translateX(-50%) scale(0.95);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.search-icon {
  width: 1.2em;
  height: 1.2em;
  transition: transform 0.3s;
}

.search-button:hover .search-icon {
  transform: scaleX(-1);
}

@media (max-width: 850px) {
  .search-button {
    top: calc(65px + env(safe-area-inset-top));
    padding: 8px 14px;
    font-size: 14px;
  }
}

@media (max-width: 400px) {
  .search-button {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>


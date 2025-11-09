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

const clips = ref<Clip[]>([])
const loading = ref(true)
const error = ref('')
const activePage = ref(0)
const activeClipId = ref<string | null>(null)
const pageReel = ref<HTMLElement | null>(null)
const clipErrors = ref<{ [key: string]: boolean }>({})
const userUnmutedOnce = ref(false)
const userInteracted = ref(false)

const windowWidth = ref(window.innerWidth)
const isAppleWatch = computed(() => windowWidth.value <= 196)
const isMobile = computed(() => windowWidth.value <= 850)
const clipsPerPage = computed(() => isMobile.value ? 2 : 6)

const totalPages = computed(() => Math.ceil(clips.value.length / clipsPerPage.value))

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

const { setupScrollListeners, cleanupScrollListeners, handleItemClick, scrollTimeout, isManualScroll, isScrolling } = useHorizontalScroll({
  containerRef: pageReel,
  activeIndex: activePage,
  totalItems: totalPages,
  itemSelector: '.page-item'
})

const handleKeyDown = (e: KeyboardEvent) => {
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
  window.addEventListener('resize', updateWindowWidth)
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
  window.removeEventListener('resize', updateWindowWidth)
  cleanupScrollListeners()
  document.removeEventListener('keydown', handleKeyDown, { capture: true } as any)
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

const handlePageClick = (pageIndex: number, event?: MouseEvent) => {
  scrollToPage(pageIndex)
}

const loadClips = async () => {
  loading.value = true
  error.value = ''

  try {
    clips.value = await apiService.getUserClips()
  } catch (err: any) {
    error.value = err.message || 'Failed to load clips'
  } finally {
    loading.value = false
  }
}

const getClipsForPage = (pageIndex: number) => {
  const start = pageIndex * clipsPerPage.value
  const end = start + clipsPerPage.value
  return clips.value.slice(start, end)
}

const handleDelete = async (clipName: string) => {
  try {
    await apiService.deleteClip(clipName)
    clips.value = clips.value.filter((clip) => clip.name !== clipName)
  } catch (err: any) {
    console.error('Failed to delete clip:', err)
  }
}

const handleDownload = async (clip: Clip) => {
  try {
    const a = document.createElement('a')
    a.href = apiService.getVideoUrl(clip.name)
    a.download = `${clip.name}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err: any) {
    console.error('Failed to download clip:', err)
  }
}

const getVideoUrl = (clipName: string) => {
  return apiService.getVideoUrl(clipName)
}

const getThumbnailUrl = (clipName: string) => {
  return apiService.getThumbnailUrl(clipName)
}

const handleVideoClick = (clip: Clip, event: Event) => {
  const video = (event.target as HTMLVideoElement)

  if (!userInteracted.value) {
    userInteracted.value = true
  }

  if (activeClipId.value === clip.id) {
    if (video.muted) {
      video.muted = false
      userUnmutedOnce.value = true
      if (video.paused) {
        video.play().catch(() => {})
      }
    } else if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  } else {
    document.querySelectorAll('.clip-video').forEach((v) => {
      (v as HTMLVideoElement).pause()
    })

    activeClipId.value = clip.id
    video.play().catch(() => {})
  }
}

const handleVideoError = (clipId: string) => {
  console.error('Video error for clip:', clipId)
  clipErrors.value = { ...clipErrors.value, [clipId]: true }
}

const pauseInactivePageVideos = () => {
  if (!pageReel.value) return

  const pages = pageReel.value.querySelectorAll('.page-item')
  pages.forEach((page, pageIndex) => {
    if (pageIndex !== activePage.value) {
      const videos = page.querySelectorAll('video')
      videos.forEach((video) => {
        if (!video.paused) {
          video.pause()
          video.currentTime = 0
        }
      })
    }
  })

  if (activeClipId.value) {
    activeClipId.value = null
  }
}

watch(activePage, () => {
  if (!isScrolling.value) {
    pauseInactivePageVideos()
  }
})
</script>

<template>
  <UserButtons fixed :show-my-clips="false" />
  <LogoHeader v-if="!isMobile" />
  <AppFooter />

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
            :is-active="activeClipId === clip.id"
            :has-error="!!clipErrors[clip.id]"
            :user-unmuted="userUnmutedOnce"
            :user-interacted="userInteracted"
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
    grid-auto-rows: 1fr;
    gap: 1.5rem;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 32px;
    backdrop-filter: blur(8px);
  }

  .clips-grid:has(> :nth-child(1):nth-last-child(1)),
  .clips-grid:has(> :nth-child(1):nth-last-child(2)),
  .clips-grid:has(> :nth-child(1):nth-last-child(3)) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    justify-items: center;
    align-items: center;
  }
}

@media (min-width: 851px) and (max-width: 1200px) {
  .clips-grid {
    width: 80vw;
  }
}
</style>


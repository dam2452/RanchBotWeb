<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
import UserButtons from '@/components/layout/UserButtons.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import LogoHeader from '@/components/layout/LogoHeader.vue'
import MyClipCard from '@/components/clips/MyClipCard.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useHorizontalScroll } from '@/composables/useHorizontalScroll'
import { useVideoControl } from '@/composables/useVideoControl'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { useMyClips } from '@/composables/useMyClips'
import { clipService } from '@/services/clipService'
import { MOBILE_BREAKPOINT, WATCH_BREAKPOINT } from '@/utils/formatters'
import type { Clip } from '@/types'

const pageReel = ref<HTMLElement | null>(null)
const activePage = ref(0)

const { windowWidth } = useWindowWidth()
const isAppleWatch = computed(() => windowWidth.value <= WATCH_BREAKPOINT)
const isMobile = computed(() => windowWidth.value <= MOBILE_BREAKPOINT)

const {
  clips, loading, error, clipErrors, totalPages,
  getClipsForPage, loadClips, deleteClip, downloadClip, markVideoError,
} = useMyClips({ isMobile })

const { activeVideoId, pauseAllVideos, toggleByClipId, toggleVideo } = useVideoControl({
  containerRef: pageReel,
  videoSelector: 'video.clip-video'
})

const { setupScrollListeners, cleanupScrollListeners, scrollTimeout, scrollToItem } = useHorizontalScroll({
  containerRef: pageReel,
  activeIndex: activePage,
  totalItems: totalPages,
  itemSelector: '.page-item',
  enableKeyboard: false
})

const _handleKeyDown = (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.key === ' ') {
    e.preventDefault()
    e.stopPropagation()
    if (activeVideoId.value) toggleVideo(activeVideoId.value)
    return
  }

  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    e.stopPropagation()
    scrollToItem(Math.max(0, activePage.value - 1))
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    e.stopPropagation()
    scrollToItem(Math.min(totalPages.value - 1, activePage.value + 1))
  }
}

const handleVideoClick = (clip: Clip, _event: Event) => {
  const activePageElement = pageReel.value?.querySelector('.page-item.active-page')
  if (!activePageElement) return

  toggleByClipId(String(clip.id), '.page-item.active-page')
}

onMounted(async () => {
  await loadClips()
  await nextTick()
  if (clips.value.length > 0) {
    setupScrollListeners()
    await nextTick()
    document.addEventListener('keydown', _handleKeyDown, { capture: true })
    scrollToItem(0)
  }
})

onUnmounted(() => {
  cleanupScrollListeners()
  document.removeEventListener('keydown', _handleKeyDown, { capture: true } as EventListenerOptions)
  if (scrollTimeout.value) clearTimeout(scrollTimeout.value)
})

watch(activePage, pauseAllVideos)
</script>

<template>
  <UserButtons fixed compact :show-my-clips="false" />
  <LogoHeader v-if="!isMobile" indent-left />
  <AppFooter />

  <button v-if="!isAppleWatch" class="back-button" @click="$router.back()">
    <svg class="back-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  </button>

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
        @click="scrollToItem(pageIndex - 1)"
      >
        <div class="clips-grid">
          <MyClipCard
            v-for="clip in getClipsForPage(pageIndex - 1)"
            :key="clip.id"
            :clip="clip"
            :video-url="clipService.getVideoUrl(clip.name)"
            :thumbnail-url="clipService.getThumbnailUrl(clip.name)"
            :is-active="activeVideoId === String(clip.id)"
            :has-error="!!clipErrors[clip.id]"
            @video-click="(e) => handleVideoClick(clip, e)"
            @download="downloadClip(clip)"
            @delete="deleteClip(clip.name)"
            @video-error="markVideoError(clip.id)"
          />
        </div>
      </div>

      <div v-if="!isAppleWatch" class="scroll-spacer"></div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.main-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.center-message {
  width: 100%;
  height: 100%;
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
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.4;

  @include tablet-down {
    font-size: clamp(0.9rem, 4vw, 1.2rem);
    max-width: 85vw;
  }
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
  scroll-padding-top: 120px;
  padding: 120px 0 60px;
  align-items: center;
  gap: 1.5rem;

  &::-webkit-scrollbar {
    display: none;
  }

  @include tablet {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scroll-padding-left: 0;
    padding: 0 10vw;
    gap: 0;
    align-items: center;
  }
}

.page-item {
  scroll-snap-align: start;
  transition: opacity 0.35s, transform 0.35s;
  flex-shrink: 0;
  width: 85vw;
  height: 62vh;
  height: 62dvh;
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  opacity: 0.45;
  transform: scale(0.88);
  pointer-events: auto;

  &.active-page {
    opacity: 1;
    transform: scale(1);
    z-index: 50;
  }

  @include tablet {
    scroll-snap-align: center;
    width: auto;
    height: 100%;
    margin: 0 2rem;
    opacity: 1;
    transform: scale(1);

    &:not(.active-page) {
      opacity: 0.5;
      transform: scale(0.9);
    }
  }
}

:deep(.clip-card) {
  @include tablet-down {
    flex: 1;
    min-height: 0;
    height: 100%;
  }
}

:deep(.video-container) {
  @include tablet-down {
    min-height: 0;
    max-height: none;
    flex: 1;
  }
}

.clips-grid {
  width: 85vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
  background: transparent;
  backdrop-filter: none;

  @include tablet {
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

    > * {
      min-height: 0;
      min-width: 0;
    }

    &:has(> :nth-child(1):nth-last-child(1)),
    &:has(> :nth-child(1):nth-last-child(2)),
    &:has(> :nth-child(1):nth-last-child(3)),
    &:has(> :nth-child(1):nth-last-child(4)),
    &:has(> :nth-child(1):nth-last-child(5)) {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 1fr);
      justify-items: center;
      align-items: center;
    }

    &:has(> :nth-child(1):nth-last-child(1)),
    &:has(> :nth-child(1):nth-last-child(2)),
    &:has(> :nth-child(1):nth-last-child(3)) {
      grid-template-rows: 1fr;
    }
  }

  @include desktop {
    width: 80vw;
  }
}

.scroll-spacer {
  width: 100%;
  height: 40vh;
  flex-shrink: 0;
  pointer-events: none;

  @include tablet {
    width: 50vw;
    height: 100%;
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

  &:hover {
    transform: translateX(-50%) scale(1.05);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateX(-50%) scale(0.95);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  }

  @include tablet-down {
    top: calc(65px + env(safe-area-inset-top));
    padding: 8px 14px;
    font-size: 14px;
  }

  @include small-mobile {
    padding: 6px 12px;
    font-size: 13px;
  }
}

.search-icon {
  width: 1.2em;
  height: 1.2em;
  transition: transform 0.3s;
}

.search-button:hover .search-icon {
  transform: scaleX(-1);
}

.back-button {
  position: fixed;
  top: calc(20px + env(safe-area-inset-top));
  left: calc(20px + env(safe-area-inset-left));
  z-index: 1015;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(36px, 5vw, 44px);
  height: clamp(36px, 5vw, 44px);
  background: linear-gradient(145deg, #aaaaaa, #999999);
  border: none;
  border-radius: 15px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;

  @include tablet-down {
    top: calc(15px + env(safe-area-inset-top));
    left: calc(15px + env(safe-area-inset-left));
  }

  @media (max-width: 400px) {
    width: 32px;
    height: 32px;
  }

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.back-chevron {
  width: 22px;
  height: 22px;
}
</style>

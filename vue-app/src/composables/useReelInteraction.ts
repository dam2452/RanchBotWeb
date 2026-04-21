import { ref, type Ref } from 'vue'
import { useVideoStore } from '@/stores/video'

interface UseReelInteractionOptions {
  videoReel: Ref<HTMLElement | null>
  activeIndex: Ref<number>
  pauseAllVideos: () => void
  scrollToItem: (index: number) => void
  displayedCount: Ref<number>
  loadedClips: Ref<number>
  resultsLength: Ref<number>
  loadingClips: Ref<boolean>
  scrollTimeout: Ref<number | null>
  isManualScroll: Ref<boolean>
  loadMore: () => void
  loadVideo: (index: number) => void
}

export function useReelInteraction(options: UseReelInteractionOptions) {
  const {
    videoReel, activeIndex, pauseAllVideos, scrollToItem,
    displayedCount, loadedClips, resultsLength, loadingClips,
    scrollTimeout, isManualScroll, loadMore, loadVideo
  } = options

  const editingClipIndex = ref<number | null>(null)
  const videoStore = useVideoStore()

  const _isButtonClicked = (event: MouseEvent): boolean => {
    const target = event.target as HTMLElement
    return !!target.closest('.adjust-btn') || !!target.closest('.download-btn') || !!target.closest('button')
  }

  const _handleEditingClick = (index: number, event: MouseEvent): boolean => {
    if (editingClipIndex.value === null) return false

    if (index !== editingClipIndex.value) {
      editingClipIndex.value = null
      return true
    }

    const video = (event.currentTarget as HTMLElement).querySelector('video')
    if (video) {
      video.paused ? video.play().catch(() => {}) : video.pause()
    }
    return true
  }

  const _handleActiveClipClick = (index: number, event: MouseEvent): boolean => {
    if (index !== activeIndex.value) return false

    const videos = videoReel.value?.querySelectorAll('.reel-item video') as NodeListOf<HTMLVideoElement>
    const video = (event.currentTarget as HTMLElement).querySelector('video')
    if (!video) return true

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

    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
      scrollTimeout.value = null
    }
    isManualScroll.value = false
    return true
  }

  const _navigateToClip = (index: number): void => {
    videoStore.markInteracted()
    scrollToItem(index)
  }

  const handleClipClick = (index: number, event: MouseEvent): void => {
    if (_isButtonClicked(event)) return
    if (_handleEditingClick(index, event)) return
    if (_handleActiveClipClick(index, event)) return
    _navigateToClip(index)
  }

  const handleAdjust = (index: number): void => {
    if (editingClipIndex.value === index) {
      editingClipIndex.value = null
    } else {
      editingClipIndex.value = index
      activeIndex.value = index
      scrollToItem(index)
    }
  }

  const handleReelClick = (event: MouseEvent): void => {
    videoStore.markInteracted()
    if (editingClipIndex.value === null) return

    const target = event.target as HTMLElement
    if (!target.closest('.reel-item') || (!target.closest('.clip-video') && !target.closest('.edit-panel'))) {
      editingClipIndex.value = null
    }
  }

  const handleLoadVideo = (index: number): void => {
    const clip = videoReel.value?.querySelectorAll('.reel-item')[index]
    const video = clip?.querySelector('video') as HTMLVideoElement | null
    if (video && video.src && video.readyState >= 2) {
      video.play().catch(() => {})
      return
    }
    loadVideo(index)
  }

  const handleActiveIndexChange = (newIndex: number, oldIndex: number): void => {
    if (!videoReel.value || newIndex === oldIndex) return

    if (editingClipIndex.value !== null && editingClipIndex.value !== newIndex) {
      editingClipIndex.value = null
    }

    pauseAllVideos()

    const isMobile = window.innerWidth <= 850
    if (isMobile && !loadingClips.value && editingClipIndex.value === null
      && newIndex >= loadedClips.value - 1 && loadedClips.value < resultsLength.value) {
      loadMore()
    }
  }

  const closeEditor = (): void => {
    editingClipIndex.value = null
  }

  return {
    editingClipIndex,
    handleClipClick,
    handleAdjust,
    handleReelClick,
    handleLoadVideo,
    handleActiveIndexChange,
    closeEditor
  }
}

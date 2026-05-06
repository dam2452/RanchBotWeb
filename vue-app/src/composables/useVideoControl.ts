import { ref, type Ref } from 'vue'
import { useVideoStore } from '@/stores/video'
import { IS_MOBILE } from '@/utils/formatters'

interface UseVideoControlOptions {
  containerRef: Ref<HTMLElement | null>
  videoSelector?: string
}

export function useVideoControl(options: UseVideoControlOptions) {
  const { containerRef, videoSelector = 'video' } = options
  const videoStore = useVideoStore()

  const activeVideoId = ref<string | null>(null)

  const _playWithUnmute = (video: HTMLVideoElement): void => {
    if (IS_MOBILE) video.muted = false
    video.play().catch(() => {})
  }

  const pauseAllVideos = (): void => {
    if (!containerRef.value) return
    const videos = containerRef.value.querySelectorAll(videoSelector) as NodeListOf<HTMLVideoElement>
    videos.forEach((video) => {
      if (!video.paused) video.pause()
    })
    activeVideoId.value = null
  }

  const _findVideoByIdentifier = (identifier: string): HTMLVideoElement | null => {
    if (!containerRef.value) return null
    const videos = containerRef.value.querySelectorAll(videoSelector) as NodeListOf<HTMLVideoElement>
    for (const video of videos) {
      const card = video.closest('[data-clip-id]')
      const cardId = card?.getAttribute('data-clip-id')
      if (card && cardId === String(identifier)) return video
      if (video.dataset.clipId === String(identifier)) return video
      if (video.src.includes(String(identifier))) return video
    }
    return null
  }

  const playVideo = (identifier: string): boolean => {
    const video = _findVideoByIdentifier(identifier)
    if (!video) return false
    _playWithUnmute(video)
    activeVideoId.value = identifier
    return true
  }

  const pauseVideo = (identifier: string): boolean => {
    const video = _findVideoByIdentifier(identifier)
    if (!video) return false
    video.pause()
    return true
  }

  const toggleVideo = (identifier: string): boolean => {
    videoStore.markInteracted()
    const video = _findVideoByIdentifier(identifier)
    if (!video) return false

    if (activeVideoId.value === String(identifier)) {
      if (video.paused) {
        _playWithUnmute(video)
      } else {
        video.pause()
      }
    } else {
      pauseAllVideos()
      activeVideoId.value = String(identifier)
      _playWithUnmute(video)
    }
    return true
  }

  const playVideoAtIndex = (index: number): boolean => {
    if (!containerRef.value) return false
    const videos = containerRef.value.querySelectorAll(videoSelector) as NodeListOf<HTMLVideoElement>
    if (index < 0 || index >= videos.length) return false
    pauseAllVideos()
    const video = videos[index]
    if (video && video.readyState >= 2) {
      _playWithUnmute(video)
      activeVideoId.value = video.dataset.clipId || video.src
      return true
    }
    return false
  }

  const toggleVideoAtIndex = (index: number): boolean => {
    if (!containerRef.value) return false
    const videos = containerRef.value.querySelectorAll(videoSelector) as NodeListOf<HTMLVideoElement>
    if (index < 0 || index >= videos.length) return false
    const video = videos[index]
    if (!video) return false

    if (video.paused) {
      pauseAllVideos()
      _playWithUnmute(video)
      activeVideoId.value = video.dataset.clipId || video.src
    } else {
      video.pause()
    }
    return true
  }

  const toggleByClipId = (clipId: string, containerSelector: string = ''): boolean => {
    const root = containerSelector && containerRef.value
      ? containerRef.value.querySelector(containerSelector) : containerRef.value
    if (!root) return false

    const videos = root.querySelectorAll(videoSelector) as NodeListOf<HTMLVideoElement>
    let targetVideo: HTMLVideoElement | null = null

    for (const video of videos) {
      const card = video.closest('[data-clip-id]')
      const cardId = card?.getAttribute('data-clip-id')
      if ((card && cardId === String(clipId)) || video.dataset.clipId === String(clipId)) {
        targetVideo = video
        break
      }
    }

    if (!targetVideo) {
      pauseAllVideos()
      activeVideoId.value = String(clipId)
      return false
    }

    if (activeVideoId.value === String(clipId)) {
      if (targetVideo.paused) {
        _playWithUnmute(targetVideo)
      } else {
        targetVideo.pause()
      }
    } else {
      pauseAllVideos()
      activeVideoId.value = String(clipId)
      if (targetVideo.readyState >= 2) _playWithUnmute(targetVideo)
    }
    return true
  }

  return {
    activeVideoId,
    pauseAllVideos,
    playVideo,
    pauseVideo,
    toggleVideo,
    playVideoAtIndex,
    toggleVideoAtIndex,
    toggleByClipId
  }
}

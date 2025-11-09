import { ref, type Ref } from 'vue'

interface UseVideoControlOptions {
  containerRef: Ref<HTMLElement | null>
  videoSelector?: string
}

export function useVideoControl(options: UseVideoControlOptions) {
  const { containerRef, videoSelector = 'video' } = options

  const activeVideoId = ref<string | null>(null)
  const userInteracted = ref(false)

  const pauseAllVideos = () => {
    if (!containerRef.value) return

    const videos = containerRef.value.querySelectorAll(videoSelector) as NodeListOf<HTMLVideoElement>
    videos.forEach((video) => {
      if (!video.paused) {
        video.pause()
      }
    })

    activeVideoId.value = null
  }

  const findVideoByIdentifier = (identifier: string): HTMLVideoElement | null => {
    if (!containerRef.value) return null

    const videos = containerRef.value.querySelectorAll(videoSelector) as NodeListOf<HTMLVideoElement>

    for (const video of videos) {
      const card = video.closest('[data-clip-id]')
      const cardId = card?.getAttribute('data-clip-id')
      const videoId = video.dataset.clipId

      if (card && cardId === String(identifier)) {
        return video
      }
      if (videoId === String(identifier)) {
        return video
      }
      if (video.src.includes(String(identifier))) {
        return video
      }
    }

    return null
  }

  const playVideo = (identifier: string) => {
    const video = findVideoByIdentifier(identifier)
    if (!video) return false

    video.play().catch(() => {})
    activeVideoId.value = identifier
    return true
  }

  const pauseVideo = (identifier: string) => {
    const video = findVideoByIdentifier(identifier)
    if (!video) return false

    video.pause()
    return true
  }

  const toggleVideo = (identifier: string) => {
    if (!userInteracted.value) {
      userInteracted.value = true
    }

    const video = findVideoByIdentifier(identifier)

    if (!video) {
      return false
    }

    if (activeVideoId.value === String(identifier)) {
      if (video.paused) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    } else {
      pauseAllVideos()
      activeVideoId.value = String(identifier)
      video.play().catch(() => {})
    }

    return true
  }

  const playVideoAtIndex = (index: number) => {
    if (!containerRef.value) return false

    const videos = containerRef.value.querySelectorAll(videoSelector) as NodeListOf<HTMLVideoElement>
    if (index < 0 || index >= videos.length) return false

    pauseAllVideos()

    const video = videos[index]
    if (video && video.readyState >= 2) {
      video.play().catch(() => {})
      activeVideoId.value = video.dataset.clipId || video.src
      return true
    }

    return false
  }

  const toggleVideoAtIndex = (index: number) => {
    if (!containerRef.value) return false

    const videos = containerRef.value.querySelectorAll(videoSelector) as NodeListOf<HTMLVideoElement>
    if (index < 0 || index >= videos.length) return false

    const video = videos[index]
    if (!video) return false

    if (video.paused) {
      pauseAllVideos()
      video.play().catch(() => {})
      activeVideoId.value = video.dataset.clipId || video.src
    } else {
      video.pause()
    }

    return true
  }

  return {
    activeVideoId,
    userInteracted,
    pauseAllVideos,
    findVideoByIdentifier,
    playVideo,
    pauseVideo,
    toggleVideo,
    playVideoAtIndex,
    toggleVideoAtIndex
  }
}

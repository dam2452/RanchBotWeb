import { ref, type Ref } from 'vue'
import { clipService } from '@/services/clipService'
import type { SearchResult } from '@/types'

export interface ClipState {
  videoUrl?: string
  thumbnailUrl?: string
  hasError: boolean
}

interface UseClipLoaderOptions {
  results: Ref<SearchResult[]>
  searchId: Ref<number>
}

export function useClipLoader(options: UseClipLoaderOptions) {
  const { results, searchId } = options

  const clips = ref<Record<number, ClipState>>({})
  const loadedClips = ref(0)
  const loadingClips = ref(false)
  let lastLoadTime = 0

  const revokeAll = () => {
    Object.values(clips.value).forEach(state => {
      if (state.videoUrl) URL.revokeObjectURL(state.videoUrl)
      if (state.thumbnailUrl) URL.revokeObjectURL(state.thumbnailUrl)
    })
  }

  const reset = () => {
    revokeAll()
    clips.value = {}
    loadedClips.value = 0
  }

  const _loadSingleClip = async (i: number, currentSearchId: number): Promise<void> => {
    const clipResult = results.value[i]
    if (!clipResult) return

    const clipPositionId = (i + 1).toString()

    clips.value[i] = { hasError: false }

    try {
      const thumbnailPromise = clipService.getThumbnail(clipPositionId)
      const videoPromise = clipService.getVideo(clipPositionId)

      const thumbnailBlob = await thumbnailPromise
      if (searchId.value !== currentSearchId) return

      clips.value[i] = { ...clips.value[i], thumbnailUrl: URL.createObjectURL(thumbnailBlob) }

      const videoBlob = await videoPromise
      if (searchId.value !== currentSearchId) {
        const thumb = clips.value[i]?.thumbnailUrl
        if (thumb) URL.revokeObjectURL(thumb)
        return
      }

      clips.value[i] = { ...clips.value[i], videoUrl: URL.createObjectURL(videoBlob) }
    } catch (err) {
      console.error(`Failed to load clip ${i}:`, err)
      clips.value[i] = { ...clips.value[i], hasError: true }
    }
  }

  const loadNextClips = async (batchSize = 2) => {
    if (loadingClips.value) return

    const currentSearchId = searchId.value
    loadingClips.value = true
    const startIdx = loadedClips.value
    const endIdx = Math.min(startIdx + batchSize, results.value.length)

    loadedClips.value = endIdx

    await Promise.all(
      Array.from({ length: endIdx - startIdx }, (_, offset) =>
        _loadSingleClip(startIdx + offset, currentSearchId)
      )
    )

    loadingClips.value = false
    lastLoadTime = Date.now()
  }

  const loadVideoForClip = async (index: number) => {
    if (clips.value[index]?.videoUrl) return

    const clipPositionId = (index + 1).toString()
    try {
      const blob = await clipService.getVideo(clipPositionId)
      clips.value[index] = { ...clips.value[index], videoUrl: URL.createObjectURL(blob), hasError: false }
    } catch (err) {
      console.error(`Failed to load video for clip ${index}:`, err)
      clips.value[index] = { ...clips.value[index], hasError: true }
    }
  }

  const getLastLoadTime = () => lastLoadTime

  return {
    clips,
    loadedClips,
    loadingClips,
    loadNextClips,
    loadVideoForClip,
    revokeAll,
    reset,
    getLastLoadTime
  }
}

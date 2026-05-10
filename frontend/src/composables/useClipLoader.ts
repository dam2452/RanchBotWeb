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
      if (state.videoUrl?.startsWith('blob:')) URL.revokeObjectURL(state.videoUrl)
      if (state.thumbnailUrl) URL.revokeObjectURL(state.thumbnailUrl)
    })
  }

  const reset = () => {
    revokeAll()
    clips.value = {}
    loadedClips.value = 0
  }

  const _loadSingleClip = async (i: number, currentSearchId: number, retries = 1): Promise<void> => {
    const clipResult = results.value[i]
    if (!clipResult) return

    const clipPositionId = (i + 1).toString()

    clips.value[i] = { hasError: false }

    try {
      const thumbnailPromise = clipService.getThumbnail(clipPositionId)

      clips.value[i] = {
        ...clips.value[i],
        videoUrl: clipService.getVideoStreamUrl(clipPositionId, currentSearchId),
      }

      const thumbnailBlob = await thumbnailPromise
      if (searchId.value !== currentSearchId) return

      clips.value[i] = { ...clips.value[i], thumbnailUrl: URL.createObjectURL(thumbnailBlob) }
    } catch (err) {
      if (retries > 0 && searchId.value === currentSearchId) {
        await new Promise(r => setTimeout(r, 500))
        return _loadSingleClip(i, currentSearchId, retries - 1)
      }
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

    const prefetchStart = endIdx
    const prefetchEnd = Math.min(prefetchStart + batchSize, results.value.length)
    if (prefetchStart < prefetchEnd) {
      const ids = Array.from({ length: prefetchEnd - prefetchStart }, (_, i) => String(prefetchStart + i + 1))
      clipService.prefetchVideos(ids, currentSearchId)
    }
  }

  const loadVideoForClip = (index: number): void => {
    if (clips.value[index]?.videoUrl) return

    const clipPositionId = (index + 1).toString()
    clips.value[index] = {
      ...clips.value[index],
      videoUrl: clipService.getVideoStreamUrl(clipPositionId, searchId.value),
      hasError: false,
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

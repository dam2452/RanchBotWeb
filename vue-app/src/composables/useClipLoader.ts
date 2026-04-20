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

  const loadNextClips = async (batchSize = 2) => {
    if (loadingClips.value) return

    const currentSearchId = searchId.value
    loadingClips.value = true
    const startIdx = loadedClips.value
    const endIdx = Math.min(startIdx + batchSize, results.value.length)

    for (let i = startIdx; i < endIdx; i++) {
      if (searchId.value !== currentSearchId) break

      const clipResult = results.value[i]
      if (!clipResult) continue

      const clipPositionId = (i + 1).toString()

      try {
        const thumbnailBlob = await clipService.getThumbnail(clipPositionId, clipResult.id || undefined)
        if (searchId.value !== currentSearchId) break

        const thumbnailUrl = URL.createObjectURL(thumbnailBlob)
        const videoBlob = await clipService.getVideo(clipPositionId)

        if (searchId.value !== currentSearchId) {
          URL.revokeObjectURL(thumbnailUrl)
          break
        }

        clips.value[i] = {
          videoUrl: URL.createObjectURL(videoBlob),
          thumbnailUrl,
          hasError: false
        }
        loadedClips.value = i + 1
      } catch (err) {
        console.error(`Failed to load clip ${i}:`, err)
        clips.value[i] = { hasError: true }
        loadedClips.value = i + 1
      }
    }

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

import { ref, computed, type Ref } from 'vue'
import { clipService } from '@/services/clipService'
import { downloadFile } from '@/utils/formatters'
import type { Clip } from '@/types'

interface UseMyClipsOptions {
  isMobile: Ref<boolean>
}

export function useMyClips({ isMobile }: UseMyClipsOptions) {
  const clips = ref<Clip[]>([])
  const loading = ref(true)
  const error = ref('')
  const clipErrors = ref<Record<string, boolean>>({})

  const clipsPerPage = computed(() => isMobile.value ? 2 : 6)
  const totalPages = computed(() => Math.ceil(clips.value.length / clipsPerPage.value))

  const getClipsForPage = (pageIndex: number): Clip[] => {
    const start = pageIndex * clipsPerPage.value
    return clips.value.slice(start, start + clipsPerPage.value)
  }

  const loadClips = async (): Promise<void> => {
    loading.value = true
    error.value = ''

    try {
      clips.value = await clipService.getUserClips()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load clips'
    } finally {
      loading.value = false
    }
  }

  const deleteClip = async (clipName: string): Promise<void> => {
    try {
      await clipService.deleteClip(clipName)
      clips.value = clips.value.filter((clip) => clip.name !== clipName)
    } catch (err: unknown) {
      console.error('Failed to delete clip:', err)
    }
  }

  const downloadClip = (clip: Clip): void => {
    downloadFile(clipService.getVideoUrl(clip.name), `${clip.name}.mp4`)
  }

  const markVideoError = (clipId: string): void => {
    clipErrors.value = { ...clipErrors.value, [clipId]: true }
  }

  return {
    clips,
    loading,
    error,
    clipErrors,
    clipsPerPage,
    totalPages,
    getClipsForPage,
    loadClips,
    deleteClip,
    downloadClip,
    markVideoError,
  }
}

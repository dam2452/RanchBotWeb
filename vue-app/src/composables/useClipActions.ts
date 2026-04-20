import { apiService } from '@/services/api'
import { createClipFilename, downloadBlob, downloadFile } from '@/utils/formatters'

interface UseClipActionsOptions {
  clipIndex: number
  videoUrl: string | undefined
  searchQuery?: string
}

export function useClipActions(options: UseClipActionsOptions) {
  const _clipId = (): string => (options.clipIndex + 1).toString()

  const download = async (): Promise<void> => {
    const filename = createClipFilename(options.clipIndex, 0, 0, options.searchQuery)
    if (options.videoUrl) {
      downloadFile(options.videoUrl, filename)
      return
    }
    const blob = await apiService.getVideo(_clipId())
    downloadBlob(blob, filename)
  }

  const downloadAdjusted = async (leftAdjust: number, rightAdjust: number): Promise<void> => {
    const filename = createClipFilename(options.clipIndex, leftAdjust, rightAdjust, options.searchQuery)
    const blob = leftAdjust === 0 && rightAdjust === 0
      ? await apiService.getVideo(_clipId())
      : await apiService.adjustVideo(_clipId(), leftAdjust, rightAdjust)
    downloadBlob(blob, filename)
  }

  const save = async (clipName: string): Promise<void> => {
    if (!clipName?.trim()) throw new Error('Clip name is required')
    await apiService.adjustVideo(_clipId(), 0, 0) // triggers server-side clip processing before save
    await apiService.saveClip(clipName.trim())
  }

  const saveAdjusted = async (clipName: string, leftAdjust: number, rightAdjust: number): Promise<void> => {
    if (!clipName?.trim()) throw new Error('Clip name is required')
    await apiService.adjustVideo(_clipId(), leftAdjust, rightAdjust)
    await apiService.saveClip(clipName.trim())
  }

  return { download, downloadAdjusted, save, saveAdjusted }
}

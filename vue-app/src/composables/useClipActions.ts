import { clipService } from '@/services/clipService'
import { createClipFilename, downloadBlob } from '@/utils/formatters'

interface UseClipActionsOptions {
  clipIndex: number
  videoUrl: string | undefined
  searchQuery?: string
}

export function useClipActions(options: UseClipActionsOptions) {
  const _clipId = (): string => (options.clipIndex + 1).toString()

  const download = async (onProgress?: (percent: number) => void): Promise<void> => {
    const filename = createClipFilename(options.clipIndex, 0, 0, options.searchQuery)
    const blob = await clipService.getVideo(_clipId(), onProgress)
    downloadBlob(blob, filename)
  }

  const downloadAdjusted = async (
    leftAdjust: number,
    rightAdjust: number,
    onProgress?: (percent: number) => void,
  ): Promise<void> => {
    const filename = createClipFilename(options.clipIndex, leftAdjust, rightAdjust, options.searchQuery)
    const blob = leftAdjust === 0 && rightAdjust === 0
      ? await clipService.getVideo(_clipId(), onProgress)
      : await clipService.adjustVideo(_clipId(), leftAdjust, rightAdjust, onProgress)
    downloadBlob(blob, filename)
  }

  const _sanitizeClipName = (name: string): string => name.trim().replace(/\s+/g, '_')

  const save = async (clipName: string): Promise<void> => {
    if (!clipName?.trim()) throw new Error('Clip name is required')
    await clipService.saveClipByIndex(options.clipIndex + 1, _sanitizeClipName(clipName))
  }

  const saveAdjusted = async (clipName: string, leftAdjust: number, rightAdjust: number): Promise<void> => {
    if (!clipName?.trim()) throw new Error('Clip name is required')
    await clipService.saveClipByIndex(options.clipIndex + 1, _sanitizeClipName(clipName), leftAdjust, rightAdjust)
  }

  return { download, downloadAdjusted, save, saveAdjusted }
}

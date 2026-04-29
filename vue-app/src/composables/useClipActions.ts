import { clipService } from '@/services/clipService'
import { createClipFilename, downloadBlob } from '@/utils/formatters'

interface UseClipActionsOptions {
  clipIndex: number
  videoUrl: string | undefined
  searchQuery?: string
}

export function useClipActions(options: UseClipActionsOptions) {
  const _clipId = (): string => (options.clipIndex + 1).toString()

  const download = async (): Promise<void> => {
    const filename = createClipFilename(options.clipIndex, 0, 0, options.searchQuery)
    const blob = await clipService.getVideo(_clipId())
    downloadBlob(blob, filename)
  }

  const downloadAdjusted = async (leftAdjust: number, rightAdjust: number): Promise<void> => {
    const filename = createClipFilename(options.clipIndex, leftAdjust, rightAdjust, options.searchQuery)
    const blob = leftAdjust === 0 && rightAdjust === 0
      ? await clipService.getVideo(_clipId())
      : await clipService.adjustVideo(_clipId(), leftAdjust, rightAdjust)
    downloadBlob(blob, filename)
  }

  const save = async (clipName: string): Promise<void> => {
    if (!clipName?.trim()) throw new Error('Clip name is required')
    await clipService.adjustVideo(_clipId(), 0, 0)
    await clipService.saveClip(clipName.trim())
  }

  const saveAdjusted = async (clipName: string, leftAdjust: number, rightAdjust: number): Promise<void> => {
    if (!clipName?.trim()) throw new Error('Clip name is required')
    await clipService.adjustVideo(_clipId(), leftAdjust, rightAdjust)
    await clipService.saveClip(clipName.trim())
  }

  return { download, downloadAdjusted, save, saveAdjusted }
}

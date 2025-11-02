import { apiService } from '@/services/api'
import { createClipFilename, downloadFile } from '@/utils/formatters'

interface UseClipActionsOptions {
  clipIndex: number
  videoUrl: string | undefined
  searchQuery?: string
}

export function useClipActions(options: UseClipActionsOptions) {
  const download = async () => {
    try {
      const filename = createClipFilename(options.clipIndex, 0, 0, options.searchQuery)

      if (options.videoUrl) {
        downloadFile(options.videoUrl, filename)
      } else {
        const blob = await apiService.getVideo((options.clipIndex + 1).toString())
        const url = URL.createObjectURL(blob)
        downloadFile(url, filename)
        URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      console.error('Download failed:', err)
      throw new Error('Download failed: ' + err.message)
    }
  }

  const save = async (clipName: string): Promise<void> => {
    if (!clipName || !clipName.trim()) {
      throw new Error('Clip name is required')
    }

    try {
      await apiService.adjustVideo((options.clipIndex + 1).toString(), 0, 0)
      await apiService.saveClip(clipName.trim())
    } catch (err: any) {
      console.error('Save failed:', err)
      throw new Error('Save failed: ' + err.message)
    }
  }

  return {
    download,
    save
  }
}

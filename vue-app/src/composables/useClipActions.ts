import { apiService } from '@/services/api'

interface UseClipActionsOptions {
  clipIndex: number
  videoUrl: string | undefined
}

export function useClipActions(options: UseClipActionsOptions) {
  const download = async () => {
    try {
      if (options.videoUrl) {
        const a = document.createElement('a')
        a.href = options.videoUrl
        a.download = `ranchbot_clip_${options.clipIndex + 1}.mp4`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        const blob = await apiService.getVideo((options.clipIndex + 1).toString())
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ranchbot_clip_${options.clipIndex + 1}.mp4`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
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

import { ref, watch, toValue, type Ref, type MaybeRefOrGetter } from 'vue'
import { apiService } from '@/services/api'
import { formatAdjustmentValue, createClipFilename, downloadFile } from '@/utils/formatters'

interface UseClipAdjustmentOptions {
  clipIndex: number
  originalVideoUrl: string | undefined
  isEditing: MaybeRefOrGetter<boolean>
  searchQuery?: string
  videoRef?: Ref<HTMLVideoElement | null>
}

export function useClipAdjustment(options: UseClipAdjustmentOptions) {
  const leftAdjust = ref(0)
  const rightAdjust = ref(0)
  const statusMessage = ref('Move sliders: negative values trim, positive extend')
  const isUpdatingPreview = ref(false)
  const previewUrl = ref<string | null>(null)
  const previewTimeout = ref<number | null>(null)

  const validateAdjustment = (): boolean => {
    if (!options.videoRef?.value) return true

    const video = options.videoRef.value
    if (!video.duration || isNaN(video.duration)) return true

    const newDuration = video.duration + leftAdjust.value + rightAdjust.value

    if (newDuration <= 0) {
      statusMessage.value = 'Clip not available - adjustment exceeds clip duration'
      return false
    }

    return true
  }

  const resetAdjustments = () => {
    leftAdjust.value = 0
    rightAdjust.value = 0
    statusMessage.value = 'Move sliders: negative values trim, positive extend'

    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }

    if (previewTimeout.value) {
      clearTimeout(previewTimeout.value)
      previewTimeout.value = null
    }
  }

  const updatePreview = async () => {
    if (isUpdatingPreview.value || !toValue(options.isEditing)) return

    if (!validateAdjustment()) {
      return
    }

    try {
      isUpdatingPreview.value = true
      statusMessage.value = 'Updating preview...'

      const blob = await apiService.adjustVideo(
        (options.clipIndex + 1).toString(),
        leftAdjust.value,
        rightAdjust.value
      )

      const oldUrl = previewUrl.value
      const newUrl = URL.createObjectURL(blob)
      previewUrl.value = newUrl

      if (oldUrl) {
        URL.revokeObjectURL(oldUrl)
      }

      statusMessage.value = `Left ${formatAdjustmentValue(leftAdjust.value)} | Right ${formatAdjustmentValue(rightAdjust.value)}`
    } catch (err: any) {
      statusMessage.value = 'Preview failed: ' + err.message
      console.error('Preview update failed:', err)
    } finally {
      isUpdatingPreview.value = false
    }
  }

  const schedulePreviewUpdate = () => {
    if (previewTimeout.value) {
      clearTimeout(previewTimeout.value)
    }

    const left = leftAdjust.value
    const right = rightAdjust.value

    if (left === 0 && right === 0) {
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
      }
      statusMessage.value = 'Move sliders: negative values trim, positive extend'
      return
    }

    statusMessage.value = `Adjusting: Left ${formatAdjustmentValue(left)} | Right ${formatAdjustmentValue(right)}`

    previewTimeout.value = window.setTimeout(() => {
      updatePreview()
    }, 1000)
  }

  watch([leftAdjust, rightAdjust], schedulePreviewUpdate)

  const downloadAdjusted = async () => {
    if (leftAdjust.value !== 0 || rightAdjust.value !== 0) {
      if (!validateAdjustment()) {
        return
      }
    }

    try {
      statusMessage.value = 'Preparing download...'

      const blob = leftAdjust.value === 0 && rightAdjust.value === 0
        ? await apiService.getVideo((options.clipIndex + 1).toString())
        : await apiService.adjustVideo(
            (options.clipIndex + 1).toString(),
            leftAdjust.value,
            rightAdjust.value
          )

      const filename = createClipFilename(options.clipIndex, leftAdjust.value, rightAdjust.value, options.searchQuery)
      const url = URL.createObjectURL(blob)

      downloadFile(url, filename)
      URL.revokeObjectURL(url)

      statusMessage.value = 'Download complete!'
      setTimeout(() => {
        statusMessage.value = `Left ${formatAdjustmentValue(leftAdjust.value)} | Right ${formatAdjustmentValue(rightAdjust.value)}`
      }, 2000)
    } catch (err: any) {
      statusMessage.value = 'Download failed: ' + err.message
      console.error('Download failed:', err)
    }
  }

  const saveAdjusted = async (clipName: string): Promise<boolean> => {
    if (!validateAdjustment()) {
      return false
    }

    try {
      statusMessage.value = 'Saving clip...'

      await apiService.adjustVideo(
        (options.clipIndex + 1).toString(),
        leftAdjust.value,
        rightAdjust.value
      )
      await apiService.saveClip(clipName.trim())

      statusMessage.value = 'Clip saved successfully!'
      return true
    } catch (err: any) {
      statusMessage.value = 'Save failed: ' + err.message
      console.error('Save failed:', err)
      return false
    }
  }

  return {
    leftAdjust,
    rightAdjust,
    statusMessage,
    isUpdatingPreview,
    previewUrl,
    resetAdjustments,
    downloadAdjusted,
    saveAdjusted
  }
}

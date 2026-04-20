import { ref, watch, toValue, type Ref, type MaybeRefOrGetter } from 'vue'
import { clipService } from '@/services/clipService'
import { formatAdjustmentValue } from '@/utils/formatters'

const _DEFAULT_STATUS = 'Move sliders: negative values trim, positive extend'

interface UseClipPreviewOptions {
  clipIndex: number
  isEditing: MaybeRefOrGetter<boolean>
  videoRef?: Ref<HTMLVideoElement | null>
}

export function useClipPreview(options: UseClipPreviewOptions) {
  const leftAdjust = ref(0)
  const rightAdjust = ref(0)
  const statusMessage = ref(_DEFAULT_STATUS)
  const isUpdatingPreview = ref(false)
  const previewUrl = ref<string | null>(null)
  const _previewTimeout = ref<number | null>(null)

  const validateAdjustment = (): boolean => {
    if (!options.videoRef?.value) return true
    const video = options.videoRef.value
    if (!video.duration || isNaN(video.duration)) return true
    if (video.duration + leftAdjust.value + rightAdjust.value <= 0) {
      statusMessage.value = 'Clip not available - adjustment exceeds clip duration'
      return false
    }
    return true
  }

  const resetAdjustments = (): void => {
    leftAdjust.value = 0
    rightAdjust.value = 0
    statusMessage.value = _DEFAULT_STATUS
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    if (_previewTimeout.value) {
      clearTimeout(_previewTimeout.value)
      _previewTimeout.value = null
    }
  }

  const _updatePreview = async (): Promise<void> => {
    if (isUpdatingPreview.value || !toValue(options.isEditing)) return
    if (!validateAdjustment()) return

    try {
      isUpdatingPreview.value = true
      statusMessage.value = 'Updating preview...'
      const blob = await clipService.adjustVideo(
        (options.clipIndex + 1).toString(),
        leftAdjust.value,
        rightAdjust.value
      )
      const oldUrl = previewUrl.value
      previewUrl.value = URL.createObjectURL(blob)
      if (oldUrl) URL.revokeObjectURL(oldUrl)
      statusMessage.value = `Left ${formatAdjustmentValue(leftAdjust.value)} | Right ${formatAdjustmentValue(rightAdjust.value)}`
    } catch (err: unknown) {
      statusMessage.value = 'Preview failed: ' + (err instanceof Error ? err.message : String(err))
      console.error('Preview update failed:', err)
    } finally {
      isUpdatingPreview.value = false
    }
  }

  watch([leftAdjust, rightAdjust], () => {
    if (_previewTimeout.value) clearTimeout(_previewTimeout.value)

    const left = leftAdjust.value
    const right = rightAdjust.value

    if (left === 0 && right === 0) {
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
      }
      statusMessage.value = _DEFAULT_STATUS
      return
    }

    statusMessage.value = `Adjusting: Left ${formatAdjustmentValue(left)} | Right ${formatAdjustmentValue(right)}`
    _previewTimeout.value = window.setTimeout(_updatePreview, 1000)
  })

  return {
    leftAdjust,
    rightAdjust,
    statusMessage,
    isUpdatingPreview,
    previewUrl,
    resetAdjustments,
    validateAdjustment
  }
}

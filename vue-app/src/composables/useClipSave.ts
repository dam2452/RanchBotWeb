import { ref, type Ref } from 'vue'
import { ApiWarningError } from '@/types'
import type { ToastType } from '@/composables/useToast'

interface UseClipSaveOptions {
  download: (onProgress?: (percent: number) => void) => Promise<void>
  downloadAdjusted: (left: number, right: number, onProgress?: (percent: number) => void) => Promise<void>
  save: (name: string) => Promise<void>
  saveAdjusted: (name: string, left: number, right: number) => Promise<void>
  leftAdjust: Ref<number>
  rightAdjust: Ref<number>
  showToast: (message: string, type?: ToastType, duration?: number) => void
  validateAdjustment: () => boolean
  resetAdjustments: () => void
  onCloseEditor: () => void
}

export function useClipSave(options: UseClipSaveOptions) {
  const {
    download, downloadAdjusted, save, saveAdjusted,
    leftAdjust, rightAdjust, showToast,
    validateAdjustment, resetAdjustments, onCloseEditor
  } = options

  const showSaveModal = ref(false)
  const isAdjustedSave = ref(false)
  const downloadProgress = ref<number | null>(null)

  const openSaveModal = (isAdjusted: boolean, onPauseAll: () => void): void => {
    onPauseAll()
    isAdjustedSave.value = isAdjusted
    showSaveModal.value = true
  }

  const closeModal = (): void => {
    showSaveModal.value = false
  }

  const _onProgress = (percent: number): void => {
    downloadProgress.value = percent
    if (percent >= 100) setTimeout(() => { downloadProgress.value = null }, 600)
  }

  const handleDownload = async (): Promise<void> => {
    try {
      downloadProgress.value = 0
      await download(_onProgress)
    } catch (err: unknown) {
      downloadProgress.value = null
      console.error('Download failed:', err)
    }
  }

  const handleDownloadAdjusted = async (): Promise<void> => {
    if (!validateAdjustment()) return
    try {
      showToast('Preparing download...', 'info')
      downloadProgress.value = 0
      await downloadAdjusted(leftAdjust.value, rightAdjust.value, _onProgress)
      showToast('Download complete!', 'success')
    } catch (err: unknown) {
      downloadProgress.value = null
      showToast('Download failed: ' + (err instanceof Error ? err.message : String(err)), 'error')
      console.error('Download failed:', err)
    }
  }

  const handleModalSave = async (clipName: string): Promise<void> => {
    showSaveModal.value = false
    try {
      showToast('Saving clip...', 'info')
      if (isAdjustedSave.value) {
        await saveAdjusted(clipName, leftAdjust.value, rightAdjust.value)
        showToast('Clip saved successfully!', 'success')
        setTimeout(() => { resetAdjustments(); onCloseEditor() }, 1500)
      } else {
        await save(clipName)
        showToast('Clip saved successfully!', 'success')
      }
    } catch (err: unknown) {
      if (err instanceof ApiWarningError) {
        showToast(err.message, 'warning')
      } else {
        showToast('Save failed: ' + (err instanceof Error ? err.message : String(err)), 'error')
        console.error('Save failed:', err)
      }
    }
  }

  return {
    showSaveModal,
    downloadProgress,
    openSaveModal,
    closeModal,
    handleDownload,
    handleDownloadAdjusted,
    handleModalSave
  }
}

import { ref, type Ref } from 'vue'

interface UseClipSaveOptions {
  download: (onProgress?: (percent: number) => void) => Promise<void>
  downloadAdjusted: (left: number, right: number, onProgress?: (percent: number) => void) => Promise<void>
  save: (name: string) => Promise<void>
  saveAdjusted: (name: string, left: number, right: number) => Promise<void>
  leftAdjust: Ref<number>
  rightAdjust: Ref<number>
  statusMessage: Ref<string>
  validateAdjustment: () => boolean
  resetAdjustments: () => void
  onCloseEditor: () => void
}

export function useClipSave(options: UseClipSaveOptions) {
  const {
    download, downloadAdjusted, save, saveAdjusted,
    leftAdjust, rightAdjust, statusMessage,
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
      statusMessage.value = 'Preparing download...'
      downloadProgress.value = 0
      await downloadAdjusted(leftAdjust.value, rightAdjust.value, _onProgress)
      statusMessage.value = 'Download complete!'
    } catch (err: unknown) {
      downloadProgress.value = null
      statusMessage.value = 'Download failed: ' + (err instanceof Error ? err.message : String(err))
      console.error('Download failed:', err)
    }
  }

  const handleModalSave = async (clipName: string): Promise<void> => {
    showSaveModal.value = false
    try {
      statusMessage.value = 'Saving clip...'
      if (isAdjustedSave.value) {
        await saveAdjusted(clipName, leftAdjust.value, rightAdjust.value)
        statusMessage.value = 'Clip saved successfully!'
        setTimeout(() => { resetAdjustments(); onCloseEditor() }, 1500)
      } else {
        await save(clipName)
        statusMessage.value = 'Clip saved successfully!'
        setTimeout(() => { statusMessage.value = '' }, 2000)
      }
    } catch (err: unknown) {
      statusMessage.value = 'Save failed: ' + (err instanceof Error ? err.message : String(err))
      console.error('Save failed:', err)
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

<script setup lang="ts">
import { ref, watch } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ClipActionButton from './ClipActionButton.vue'
import { apiService } from '@/services/api'

interface Props {
  index: number
  videoUrl?: string
  hasError: boolean
  isActive: boolean
  isLastLoaded?: boolean
  isEditing?: boolean
}

interface Emits {
  (e: 'click', index: number, event: MouseEvent): void
  (e: 'adjust', index: number): void
  (e: 'download', index: number): void
  (e: 'save', index: number): void
  (e: 'loaded', event: Event, index: number): void
  (e: 'close-editor'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const leftAdjust = ref(0)
const rightAdjust = ref(0)
const statusMessage = ref('Adjust the sliders to extend or trim your clip')
const isUpdatingPreview = ref(false)
const previewUrl = ref<string | null>(null)
const previewTimeout = ref<number | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

watch(() => props.isEditing, (editing) => {
  if (editing) {
    leftAdjust.value = 0
    rightAdjust.value = 0
    statusMessage.value = 'Adjust the sliders to extend or trim your clip'
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }
})

watch([leftAdjust, rightAdjust], () => {
  const left = leftAdjust.value
  const right = rightAdjust.value

  if (previewTimeout.value) {
    clearTimeout(previewTimeout.value)
  }

  if (left === 0 && right === 0) {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    if (videoRef.value && props.videoUrl) {
      videoRef.value.src = props.videoUrl
    }
    statusMessage.value = 'Adjust the sliders to extend or trim your clip'
    return
  }

  statusMessage.value = `Adjusting: Left ${left >= 0 ? '+' : ''}${left.toFixed(1)}s | Right ${right >= 0 ? '+' : ''}${right.toFixed(1)}s`

  previewTimeout.value = window.setTimeout(() => {
    updatePreview()
  }, 1000)
})

const updatePreview = async () => {
  if (isUpdatingPreview.value || !props.isEditing) return

  try {
    isUpdatingPreview.value = true
    statusMessage.value = 'Updating preview...'

    const blob = await apiService.adjustVideo(
      (props.index + 1).toString(),
      leftAdjust.value,
      rightAdjust.value
    )

    const oldUrl = previewUrl.value
    const newUrl = URL.createObjectURL(blob)
    previewUrl.value = newUrl

    if (videoRef.value) {
      const wasPlaying = !videoRef.value.paused
      videoRef.value.src = newUrl
      await videoRef.value.load()
      if (wasPlaying) {
        await videoRef.value.play().catch(() => {})
      }
    }

    if (oldUrl) {
      URL.revokeObjectURL(oldUrl)
    }

    statusMessage.value = `Left ${leftAdjust.value >= 0 ? '+' : ''}${leftAdjust.value.toFixed(1)}s | Right ${rightAdjust.value >= 0 ? '+' : ''}${rightAdjust.value.toFixed(1)}s`
  } catch (err: any) {
    statusMessage.value = 'Preview failed: ' + err.message
    console.error('Preview update failed:', err)
  } finally {
    isUpdatingPreview.value = false
  }
}

const handleClick = (event: MouseEvent) => {
  emit('click', props.index, event)
}

const handleAdjust = () => {
  emit('adjust', props.index)
}

const handleDownload = () => {
  emit('download', props.index)
}

const handleSave = () => {
  emit('save', props.index)
}

const handleLoaded = (event: Event) => {
  emit('loaded', event, props.index)
}

const handleCloseEditor = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (previewTimeout.value) {
    clearTimeout(previewTimeout.value)
  }
  emit('close-editor')
}

const handleDownloadAdjusted = async () => {
  try {
    statusMessage.value = 'Preparing download...'

    let blob: Blob
    let filename: string

    if (leftAdjust.value === 0 && rightAdjust.value === 0) {
      blob = await apiService.getVideo((props.index + 1).toString())
      filename = `clip_${props.index + 1}.mp4`
    } else {
      blob = await apiService.adjustVideo(
        (props.index + 1).toString(),
        leftAdjust.value,
        rightAdjust.value
      )
      const formatAdjust = (val: number) => val >= 0 ? `+${val.toFixed(1)}` : `${val.toFixed(1)}`
      filename = `clip_${props.index + 1}_L${formatAdjust(leftAdjust.value)}_R${formatAdjust(rightAdjust.value)}.mp4`
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    statusMessage.value = 'Download complete!'
    setTimeout(() => {
      statusMessage.value = `Left ${leftAdjust.value >= 0 ? '+' : ''}${leftAdjust.value.toFixed(1)}s | Right ${rightAdjust.value >= 0 ? '+' : ''}${rightAdjust.value.toFixed(1)}s`
    }, 2000)
  } catch (err: any) {
    statusMessage.value = 'Download failed: ' + err.message
    console.error('Download failed:', err)
  }
}

const handleSaveAdjusted = async () => {
  const clipName = prompt('Enter clip name:')
  if (!clipName || !clipName.trim()) {
    return
  }

  try {
    statusMessage.value = 'Saving clip...'

    await apiService.adjustVideo(
      (props.index + 1).toString(),
      leftAdjust.value,
      rightAdjust.value
    )
    await apiService.saveClip(clipName.trim())

    statusMessage.value = 'Clip saved successfully!'
    setTimeout(() => {
      handleCloseEditor()
    }, 1500)
  } catch (err: any) {
    statusMessage.value = 'Save failed: ' + err.message
    console.error('Save failed:', err)
  }
}
</script>

<template>
  <div
    class="reel-item snap-center transition-all duration-500 flex-shrink-0 opacity-50 scale-85 w-auto min-w-auto max-w-none mx-5 p-0 relative flex items-center justify-center cursor-pointer rounded-[32px] z-[1] max-[850px]:w-[90vw] max-[850px]:h-auto max-[850px]:max-w-[90vw] max-[850px]:my-2.5 max-[850px]:mx-0"
    :class="{
      'active opacity-100 scale-100': (isActive && !isEditing) || isEditing,
      'z-[1001]': isActive && !isEditing,
      'z-[1005]': isEditing,
      'last-loaded z-[10] !opacity-75 !scale-90': isLastLoaded && !isActive && !isEditing,
      'clip-loaded': videoUrl || hasError,
      'clip-loading': !videoUrl && !hasError,
      'h-[55vh]': !isEditing,
      'h-auto': isEditing
    }"
    :style="isActive && !isEditing ? 'box-shadow: 0 0 32px rgba(242, 169, 76, 0.8); border-radius: 32px;' : (isLastLoaded && !isActive ? 'box-shadow: 0 0 16px rgba(242, 169, 76, 0.4); border-radius: 32px;' : 'border-radius: 32px;')"
    :data-idx="index"
    @click="handleClick"
  >
    <div
      v-if="videoUrl"
      class="clip-wrapper"
      :class="{ 'editing-wrapper': isEditing }"
    >
      <video
        loop
        muted
        playsinline
        preload="auto"
        :src="videoUrl"
        @loadeddata="handleLoaded"
        class="clip-video"
        :class="{ 'editing-video': isEditing }"
        :style="isActive && !isEditing ? 'box-shadow: 0 0 0 3px #f2a94c;' : ''"
      ></video>

      <Transition name="panel-slide">
        <div v-if="isEditing" class="edit-panel">
          <div class="edit-panel-header">
            <h3>Adjust Clip #{{ index + 1 }}</h3>
            <button @click="handleCloseEditor" class="close-btn">×</button>
          </div>

          <div class="edit-controls">
            <div class="slider-group">
              <label class="slider-label">
                Left side <span class="slider-value">+0.0s</span>
              </label>
              <input type="range" min="-10" max="10" step="0.5" value="0" class="slider" />
            </div>

            <div class="slider-group">
              <label class="slider-label">
                Right side <span class="slider-value">+0.0s</span>
              </label>
              <input type="range" min="-10" max="10" step="0.5" value="0" class="slider" />
            </div>

            <div class="status-box">Adjust the sliders to extend or trim your clip</div>

            <div class="button-group">
              <button class="edit-btn download-edit-btn">Download</button>
              <button class="edit-btn save-edit-btn">Save</button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div v-else-if="hasError" class="flex flex-col items-center justify-center min-h-[300px] bg-red-100 text-red-700 p-4 rounded-xl text-center">
      <svg class="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="font-semibold text-lg">Failed to load clip</p>
      <p class="text-sm mt-1">Clip #{{ index + 1 }} is unavailable</p>
    </div>

    <div v-else class="flex flex-col items-center justify-center min-h-[300px] bg-gray-100 p-4 rounded-xl">
      <LoadingSpinner size="small" :message="`Loading clip #${index + 1}...`" />
    </div>

    <ClipActionButton
      v-if="videoUrl && !isEditing"
      variant="primary"
      position="top-left"
      size="large"
      class="adjust-btn max-[850px]:!px-5 max-[850px]:!py-4 max-[850px]:!text-xs"
      @click="handleAdjust"
    >
      Adjust
    </ClipActionButton>

    <ClipActionButton
      v-if="videoUrl && !isEditing"
      variant="secondary"
      position="top-right"
      size="large"
      class="download-btn max-[850px]:!px-5 max-[850px]:!py-4 max-[850px]:!text-xs"
      @click="handleDownload"
    >
      Download
    </ClipActionButton>

    <ClipActionButton
      v-if="videoUrl && !isEditing"
      variant="success"
      position="bottom-left"
      size="large"
      class="save-btn max-[850px]:!px-5 max-[850px]:!py-4 max-[850px]:!text-xs"
      @click="handleSave"
    >
      Save
    </ClipActionButton>
  </div>
</template>

<style scoped>
.reel-item.clip-loading {
  opacity: 0;
  transform: translateX(100px) scale(0.85);
  pointer-events: none;
}

.reel-item.clip-loaded {
  animation: slideInFromRight 0.4s ease-out forwards;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(100px) scale(0.85);
  }
  to {
    opacity: 0.5;
    transform: translateX(0) scale(0.85);
  }
}

.reel-item.clip-loaded.active {
  animation: slideInFromRightActive 0.4s ease-out forwards;
}

@keyframes slideInFromRightActive {
  from {
    opacity: 0;
    transform: translateX(100px) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.reel-item .adjust-btn,
.reel-item .download-btn,
.reel-item .save-btn {
  opacity: 0.6;
  pointer-events: auto;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reel-item.active .adjust-btn,
.reel-item.active .download-btn,
.reel-item.active .save-btn {
  opacity: 0.8;
}

.reel-item .adjust-btn:hover,
.reel-item .download-btn:hover,
.reel-item .save-btn:hover {
  opacity: 1 !important;
}

.clip-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  width: auto;
  height: auto;
  transition: all 0.5s ease;
}

.editing-wrapper {
  position: relative;
  transform: translateY(-15vh) translateX(120px) scale(1.08);
  z-index: 1001;
  filter: drop-shadow(0 0 50px rgba(242, 169, 76, 1));
}

.clip-video {
  width: auto;
  height: auto;
  max-height: 55vh;
  object-fit: contain;
  border-radius: 32px;
  display: block;
  cursor: pointer;
  transition: all 0.5s ease;
}

.editing-video {
  max-height: 52vh;
  border-radius: 32px 32px 0 0;
  margin-bottom: 0;
}

.edit-panel {
  width: 100%;
  box-sizing: border-box;
  background: #f0f0f0;
  border-radius: 0 0 32px 32px;
  padding: 14px;
  border-top: 2px solid #f2a94c;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.edit-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f8f8;
  margin: -12px -12px 12px;
  border-radius: 12px 12px 0 0;
}

.edit-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e0e0e0;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #d0d0d0;
}

.edit-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.slider-value {
  color: #f2a94c;
  font-weight: 600;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #f2a94c;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #f2a94c;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: none;
}

.status-box {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.button-group {
  display: flex;
  gap: 8px;
}

.edit-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.download-edit-btn {
  background: #f2a94c;
}

.download-edit-btn:hover {
  background: #e09340;
}

.save-edit-btn {
  background: #4CAF50;
}

.save-edit-btn:hover {
  background: #45a049;
}
</style>

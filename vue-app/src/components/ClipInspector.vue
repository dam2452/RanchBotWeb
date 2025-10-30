<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { apiService } from '@/services/api'

interface Props {
  clipIndex: number
  clipUrl: string
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const video = ref<HTMLVideoElement | null>(null)
const leftAdjust = ref(0)
const rightAdjust = ref(0)
const duration = ref(0)
const status = ref('Adjust the sliders to extend or trim your clip')
const isDownloading = ref(false)
const showSaveForm = ref(false)
const clipName = ref('')
const isUpdatingPreview = ref(false)
const currentPreviewUrl = ref<string | null>(null)
const originalUrl = ref('')
const previewTimeout = ref<number | null>(null)

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    leftAdjust.value = 0
    rightAdjust.value = 0
    originalUrl.value = props.clipUrl
    if (video.value) {
      video.value.src = props.clipUrl
      await video.value.load()
      await video.value.play().catch(() => {})
    }
  } else {
    cleanupPreview()
  }
})

watch([leftAdjust, rightAdjust], () => {
  const left = leftAdjust.value
  const right = rightAdjust.value
  status.value = `Left: ${left >= 0 ? '+' : ''}${left.toFixed(1)}s | Right: ${right >= 0 ? '+' : ''}${right.toFixed(1)}s`

  if (previewTimeout.value) {
    clearTimeout(previewTimeout.value)
  }

  previewTimeout.value = window.setTimeout(() => {
    updatePreview()
  }, 1000)
})

const handleLoadedMetadata = () => {
  if (video.value) {
    duration.value = video.value.duration
    status.value = `Duration: ${duration.value.toFixed(2)}s - Adjust sliders to extend/trim`
  }
}

const updatePreview = async () => {
  if (isUpdatingPreview.value) return

  const left = leftAdjust.value
  const right = rightAdjust.value

  if (left === 0 && right === 0) {
    if (currentPreviewUrl.value) {
      URL.revokeObjectURL(currentPreviewUrl.value)
      currentPreviewUrl.value = null
    }
    if (video.value) {
      video.value.src = originalUrl.value
      video.value.load()
    }
    return
  }

  try {
    isUpdatingPreview.value = true
    status.value = 'Updating preview...'

    const blob = await apiService.adjustVideo(
      (props.clipIndex + 1).toString(),
      left,
      right
    )

    const oldUrl = currentPreviewUrl.value
    const newUrl = URL.createObjectURL(blob)
    currentPreviewUrl.value = newUrl

    if (video.value) {
      const currentTime = video.value.currentTime
      const wasPlaying = !video.value.paused

      video.value.src = newUrl
      video.value.load()

      video.value.onloadeddata = () => {
        if (video.value) {
          video.value.currentTime = currentTime
          if (wasPlaying) {
            video.value.play().catch(() => {})
          }
        }
      }
    }

    if (oldUrl) {
      URL.revokeObjectURL(oldUrl)
    }

    status.value = `Left: ${left >= 0 ? '+' : ''}${left.toFixed(1)}s | Right: ${right >= 0 ? '+' : ''}${right.toFixed(1)}s`
  } catch (err: any) {
    status.value = 'Preview failed: ' + err.message
    console.error('Preview update failed:', err)
  } finally {
    isUpdatingPreview.value = false
  }
}

const cleanupPreview = () => {
  if (previewTimeout.value) {
    clearTimeout(previewTimeout.value)
    previewTimeout.value = null
  }
  if (currentPreviewUrl.value) {
    URL.revokeObjectURL(currentPreviewUrl.value)
    currentPreviewUrl.value = null
  }
  isUpdatingPreview.value = false
}

const handleDownloadAdjusted = async () => {
  try {
    isDownloading.value = true
    status.value = 'Preparing download...'

    let blob: Blob
    let filename: string

    if (leftAdjust.value === 0 && rightAdjust.value === 0) {
      blob = await apiService.getVideo((props.clipIndex + 1).toString())
      filename = `clip_${props.clipIndex + 1}.mp4`
    } else {
      blob = await apiService.adjustVideo(
        (props.clipIndex + 1).toString(),
        leftAdjust.value,
        rightAdjust.value
      )
      const formatAdjust = (val: number) => val >= 0 ? `+${val.toFixed(1)}` : `${val.toFixed(1)}`
      filename = `clip_${props.clipIndex + 1}_L${formatAdjust(leftAdjust.value)}_R${formatAdjust(rightAdjust.value)}.mp4`
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    status.value = 'Download complete!'
  } catch (err: any) {
    status.value = 'Download failed: ' + err.message
    console.error('Download failed:', err)
  } finally {
    isDownloading.value = false
  }
}

const handleSaveClip = async () => {
  if (!clipName.value.trim()) {
    alert('Please enter a clip name')
    return
  }

  try {
    status.value = 'Saving clip...'

    if (leftAdjust.value !== 0 || rightAdjust.value !== 0) {
      await apiService.saveAdjustedClip({
        clipId: props.clipIndex + 1,
        clipName: clipName.value,
        leftAdjust: leftAdjust.value,
        rightAdjust: rightAdjust.value
      })
    } else {
      await apiService.saveClip(clipName.value)
    }

    status.value = 'Clip saved successfully!'
    showSaveForm.value = false
    clipName.value = ''
    setTimeout(() => {
      emit('close')
    }, 1000)
  } catch (err: any) {
    status.value = 'Save failed: ' + err.message
    console.error('Save clip failed:', err)
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  cleanupPreview()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="inspector-overlay">
      <div class="inspector-backdrop" @click="$emit('close')"></div>

      <div class="inspector-modal">
        <div class="inspector-header">
          <h3 class="inspector-title">Clip Adjustment</h3>
          <button @click="$emit('close')" class="inspector-close">×</button>
        </div>

        <video
          ref="video"
          :src="clipUrl"
          class="inspector-video"
          controls
          loop
          muted
          playsinline
          autoplay
          @loadedmetadata="handleLoadedMetadata"
        ></video>

        <div class="inspector-controls">
          <div class="slider-group">
            <label class="slider-label">
              Left side <span class="slider-value">{{ leftAdjust >= 0 ? '+' : '' }}{{ leftAdjust.toFixed(1) }}s</span>
            </label>
            <input
              v-model.number="leftAdjust"
              type="range"
              min="-10"
              max="10"
              step="0.5"
              class="slider"
            />
          </div>

          <div class="slider-group">
            <label class="slider-label">
              Right side <span class="slider-value">{{ rightAdjust >= 0 ? '+' : '' }}{{ rightAdjust.toFixed(1) }}s</span>
            </label>
            <input
              v-model.number="rightAdjust"
              type="range"
              min="-10"
              max="10"
              step="0.5"
              class="slider"
            />
          </div>

          <div class="inspector-status">{{ status }}</div>

          <div class="button-group">
            <button
              @click="handleDownloadAdjusted"
              :disabled="isDownloading"
              class="inspector-btn download-btn"
            >
              {{ isDownloading ? 'Downloading...' : 'Download' }}
            </button>

            <button
              @click="showSaveForm = !showSaveForm"
              class="inspector-btn save-btn"
            >
              {{ showSaveForm ? 'Cancel' : 'Save' }}
            </button>
          </div>

          <Transition name="slide-down">
            <div v-if="showSaveForm" class="save-form">
              <input
                v-model="clipName"
                type="text"
                placeholder="Enter clip name"
                class="save-input"
                @keypress.enter="handleSaveClip"
              />
              <button @click="handleSaveClip" class="inspector-btn save-btn">
                Save Clip
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.inspector-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
}

.inspector-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.inspector-modal {
  position: relative;
  z-index: 1000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.inspector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f8f8;
}

.inspector-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.inspector-close {
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

.inspector-close:hover {
  background: #d0d0d0;
}

.inspector-video {
  width: 100%;
  max-height: 60vh;
  object-fit: contain;
  background: #000;
}

.inspector-controls {
  padding: 12px;
  background: #f0f0f0;
  border-top: 1px solid #e0e0e0;
}

.slider-group {
  margin-bottom: 12px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
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

.inspector-status {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
  text-align: center;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.inspector-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn {
  background: #f2a94c;
  color: white;
}

.download-btn:hover {
  background: #e09340;
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn {
  background: #4CAF50;
  color: white;
}

.save-btn:hover {
  background: #45a049;
}

.save-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.save-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.save-input:focus {
  border-color: #f2a94c;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 640px) {
  .inspector-modal {
    max-width: 95vw;
  }

  .inspector-video {
    max-height: 50vh;
  }

  .inspector-controls {
    padding: 10px;
  }
}
</style>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useClipPreview } from '@/composables/useClipPreview'
import { useClipActions } from '@/composables/useClipActions'
import { formatAdjustmentValue } from '@/utils/formatters'

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
const showSaveForm = ref(false)
const clipName = ref('')
const isDownloading = ref(false)
const duration = ref(0)

const _isEditing = computed(() => props.visible)
const _videoRef = computed(() => video.value)

const {
  leftAdjust,
  rightAdjust,
  statusMessage,
  isUpdatingPreview,
  previewUrl,
  resetAdjustments,
  validateAdjustment,
} = useClipPreview({
  clipIndex: props.clipIndex,
  isEditing: _isEditing,
  videoRef: _videoRef,
})

const { download, downloadAdjusted, save, saveAdjusted } = useClipActions({
  clipIndex: props.clipIndex,
  videoUrl: props.clipUrl,
})

watch(previewUrl, (newUrl) => {
  if (!video.value) return
  const currentTime = video.value.currentTime
  const wasPlaying = !video.value.paused

  video.value.src = newUrl || props.clipUrl
  video.value.load()

  video.value.onloadeddata = () => {
    if (video.value) {
      video.value.currentTime = currentTime
      if (wasPlaying) video.value.play().catch(() => {})
    }
  }
})

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    resetAdjustments()
    if (video.value) {
      video.value.src = props.clipUrl
      await video.value.load()
      await video.value.play().catch(() => {})
    }
  } else {
    resetAdjustments()
  }
})

const handleLoadedMetadata = () => {
  if (video.value) {
    duration.value = video.value.duration
  }
}

const handleDownloadAdjusted = async () => {
  if (!validateAdjustment()) return

  try {
    isDownloading.value = true
    statusMessage.value = 'Preparing download...'
    await downloadAdjusted(leftAdjust.value, rightAdjust.value)
    statusMessage.value = 'Download complete!'
  } catch (err: unknown) {
    statusMessage.value = 'Download failed: ' + (err instanceof Error ? err.message : String(err))
    console.error('Download failed:', err)
  } finally {
    isDownloading.value = false
  }
}

const handleSaveClip = async () => {
  if (!clipName.value.trim()) return

  try {
    statusMessage.value = 'Saving clip...'

    if (leftAdjust.value !== 0 || rightAdjust.value !== 0) {
      await saveAdjusted(clipName.value, leftAdjust.value, rightAdjust.value)
    } else {
      await save(clipName.value)
    }

    statusMessage.value = 'Clip saved successfully!'
    showSaveForm.value = false
    clipName.value = ''
    setTimeout(() => emit('close'), 1000)
  } catch (err: unknown) {
    statusMessage.value = 'Save failed: ' + (err instanceof Error ? err.message : String(err))
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
  resetAdjustments()
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
              Left side <span class="slider-value">{{ formatAdjustmentValue(leftAdjust) }}</span>
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
              Right side <span class="slider-value">{{ formatAdjustmentValue(rightAdjust) }}</span>
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

          <div class="inspector-status">{{ statusMessage }}</div>

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

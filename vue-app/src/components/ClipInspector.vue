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

watch(() => props.visible, (newVal) => {
  if (newVal) {
    leftAdjust.value = 0
    rightAdjust.value = 0
    originalUrl.value = props.clipUrl
    if (video.value) {
      video.value.src = props.clipUrl
      video.value.load()
      video.value.play().catch(() => {})
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
  <Transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-[2000] flex items-center justify-center">
      <div class="absolute inset-0 bg-black bg-opacity-70" @click="$emit('close')"></div>

      <div class="relative bg-white rounded-xl shadow-2xl max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden z-10">
        <div class="flex flex-col h-full max-h-[90vh]">
          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">Adjust Clip #{{ clipIndex + 1 }}</h2>
            <button @click="$emit('close')" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div class="mb-6">
              <video
                ref="video"
                :src="clipUrl"
                class="w-full h-auto rounded-lg shadow-lg"
                loop
                muted
                @loadedmetadata="handleLoadedMetadata"
              ></video>
            </div>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Left side ({{ leftAdjust >= 0 ? '+' : '' }}{{ leftAdjust.toFixed(1) }}s)
                  <span class="text-xs text-gray-500 ml-2">+ extend, - trim</span>
                </label>
                <input
                  v-model.number="leftAdjust"
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Right side ({{ rightAdjust >= 0 ? '+' : '' }}{{ rightAdjust.toFixed(1) }}s)
                  <span class="text-xs text-gray-500 ml-2">+ extend, - trim</span>
                </label>
                <input
                  v-model.number="rightAdjust"
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p class="text-sm text-blue-800 font-medium">{{ status }}</p>
              </div>

              <div class="flex gap-3">
                <button
                  @click="handleDownloadAdjusted"
                  :disabled="isDownloading"
                  class="flex-1 px-6 py-3 bg-gradient-action text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-strong"
                >
                  {{ isDownloading ? 'Downloading...' : 'Download Adjusted' }}
                </button>

                <button
                  @click="showSaveForm = !showSaveForm"
                  class="flex-1 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong"
                >
                  {{ showSaveForm ? 'Cancel Save' : 'Save to My Clips' }}
                </button>
              </div>

              <Transition name="slide-down">
                <div v-if="showSaveForm" class="space-y-3 pt-3 border-t border-gray-200">
                  <input
                    v-model="clipName"
                    type="text"
                    placeholder="Enter clip name"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    @keypress.enter="handleSaveClip"
                  />
                  <button
                    @click="handleSaveClip"
                    class="w-full px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong"
                  >
                    Save Clip
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #ffb85c;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #ffb85c;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  border: none;
}
</style>

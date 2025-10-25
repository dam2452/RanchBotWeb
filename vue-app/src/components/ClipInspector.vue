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
const leftSlider = ref(0)
const rightSlider = ref(100)
const duration = ref(0)
const status = ref('Adjust the sliders to trim your clip')
const isDownloading = ref(false)
const showSaveForm = ref(false)
const clipName = ref('')

const leftTime = () => (leftSlider.value / 100) * duration.value
const rightTime = () => (rightSlider.value / 100) * duration.value

watch(() => props.visible, (newVal) => {
  if (newVal && video.value) {
    video.value.currentTime = leftTime()
    video.value.play().catch(() => {})
  }
})

watch([leftSlider, rightSlider], () => {
  if (video.value) {
    video.value.currentTime = leftTime()
    status.value = `Trimmed: ${leftTime().toFixed(2)}s - ${rightTime().toFixed(2)}s`
  }
})

const handleLoadedMetadata = () => {
  if (video.value) {
    duration.value = video.value.duration
    status.value = `Duration: ${duration.value.toFixed(2)}s - Adjust sliders to trim`
  }
}

const handleTimeUpdate = () => {
  if (video.value && video.value.currentTime >= rightTime()) {
    video.value.currentTime = leftTime()
  }
}

const handleDownloadAdjusted = async () => {
  try {
    isDownloading.value = true
    status.value = 'Preparing adjusted clip...'

    const response = await apiService.adjustClip({
      clipId: props.clipIndex + 1,
      leftAdjust: leftSlider.value,
      rightAdjust: 100 - rightSlider.value
    })

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `adjusted_clip_${props.clipIndex + 1}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    status.value = 'Download complete!'
  } catch (err: any) {
    status.value = 'Download failed: ' + err.message
    console.error('Adjust download failed:', err)
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

    await apiService.saveAdjustedClip({
      clipId: props.clipIndex + 1,
      clipName: clipName.value,
      leftAdjust: leftSlider.value,
      rightAdjust: 100 - rightSlider.value
    })

    status.value = 'Clip saved successfully!'
    showSaveForm.value = false
    clipName.value = ''
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
                @loadedmetadata="handleLoadedMetadata"
                @timeupdate="handleTimeUpdate"
              ></video>
            </div>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Trim Start: {{ leftTime().toFixed(2) }}s
                </label>
                <input
                  v-model.number="leftSlider"
                  type="range"
                  min="0"
                  :max="rightSlider - 1"
                  step="0.1"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Trim End: {{ rightTime().toFixed(2) }}s
                </label>
                <input
                  v-model.number="rightSlider"
                  type="range"
                  :min="leftSlider + 1"
                  max="100"
                  step="0.1"
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

<script setup lang="ts">
import LoadingSpinner from './LoadingSpinner.vue'
import ClipActionButton from './ClipActionButton.vue'

interface Props {
  index: number
  videoUrl?: string
  hasError: boolean
  isActive: boolean
  isLastLoaded?: boolean
}

interface Emits {
  (e: 'click', index: number, event: MouseEvent): void
  (e: 'adjust', index: number): void
  (e: 'download', index: number): void
  (e: 'save', index: number): void
  (e: 'loaded', event: Event, index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
</script>

<template>
  <div
    class="reel-item snap-center transition-all duration-300 flex-shrink-0 opacity-50 scale-85 w-auto h-[55vh] min-w-auto max-w-none mx-5 p-0 relative flex items-center justify-center cursor-pointer rounded-[32px] z-[1] max-[850px]:w-[90vw] max-[850px]:h-auto max-[850px]:max-w-[90vw] max-[850px]:my-2.5 max-[850px]:mx-0"
    :class="{
      'active z-[50] opacity-100 scale-100': isActive,
      'last-loaded z-[10] !opacity-75 !scale-90': isLastLoaded && !isActive,
      'clip-loaded': videoUrl || hasError,
      'clip-loading': !videoUrl && !hasError
    }"
    :style="isActive ? 'box-shadow: 0 0 32px rgba(242, 169, 76, 0.8); border-radius: 32px;' : (isLastLoaded && !isActive ? 'box-shadow: 0 0 16px rgba(242, 169, 76, 0.4); border-radius: 32px;' : 'border-radius: 32px;')"
    :data-idx="index"
    @click="handleClick"
  >
    <video
      v-if="videoUrl"
      loop
      muted
      playsinline
      preload="auto"
      :src="videoUrl"
      @loadeddata="handleLoaded"
      class="w-auto h-full max-h-[55vh] object-contain rounded-[32px] block cursor-pointer aspect-auto scale-[0.99] max-[850px]:w-full max-[850px]:h-auto max-[850px]:max-h-none"
      :style="isActive ? 'box-shadow: 0 0 0 3px #f2a94c; box-sizing: border-box; border-radius: 32px;' : 'border-radius: 32px;'"
    ></video>

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
      v-if="videoUrl"
      variant="primary"
      position="top-left"
      size="large"
      class="adjust-btn max-[850px]:!px-5 max-[850px]:!py-4 max-[850px]:!text-xs"
      @click="handleAdjust"
    >
      Adjust
    </ClipActionButton>

    <ClipActionButton
      v-if="videoUrl"
      variant="secondary"
      position="top-right"
      size="large"
      class="download-btn max-[850px]:!px-5 max-[850px]:!py-4 max-[850px]:!text-xs"
      @click="handleDownload"
    >
      Download
    </ClipActionButton>

    <ClipActionButton
      v-if="videoUrl"
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

.reel-item:not(.active) .adjust-btn,
.reel-item:not(.active) .download-btn,
.reel-item:not(.active) .save-btn {
  opacity: 0;
  pointer-events: none;
}

.reel-item.active .adjust-btn,
.reel-item.active .download-btn,
.reel-item.active .save-btn {
  opacity: 0.8;
  pointer-events: auto;
  cursor: pointer;
}

.reel-item.active .adjust-btn:hover,
.reel-item.active .download-btn:hover,
.reel-item.active .save-btn:hover {
  opacity: 1 !important;
}
</style>

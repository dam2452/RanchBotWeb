<script setup lang="ts">
interface Props {
  index: number
  videoUrl?: string
  hasError: boolean
  isActive: boolean
}

interface Emits {
  (e: 'click', index: number, event: MouseEvent): void
  (e: 'adjust', index: number): void
  (e: 'download', index: number): void
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

const handleLoaded = (event: Event) => {
  emit('loaded', event, props.index)
}
</script>

<template>
  <div
    class="reel-item snap-center transition-all duration-300 flex-shrink-0 opacity-50 scale-85 w-auto h-[55vh] min-w-auto max-w-none mx-5 p-0 relative flex items-center justify-center cursor-pointer overflow-hidden rounded-[32px] z-1 max-[850px]:w-[90vw] max-[850px]:h-auto max-[850px]:max-w-[90vw] max-[850px]:my-2.5 max-[850px]:mx-0"
    :class="{ 'z-50 opacity-100 scale-100': isActive }"
    :style="isActive ? 'box-shadow: 0 0 40px rgba(242, 169, 76, 0.9), 0 0 80px rgba(242, 169, 76, 0.5);' : ''"
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
    ></video>

    <div v-else-if="hasError" class="flex flex-col items-center justify-center min-h-[300px] bg-red-100 text-red-700 p-4 rounded-xl text-center">
      <svg class="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="font-semibold text-lg">Failed to load clip</p>
      <p class="text-sm mt-1">Clip #{{ index + 1 }} is unavailable</p>
    </div>

    <button
      v-if="videoUrl"
      style="background: linear-gradient(145deg, #f2a94c, #e09340);"
      class="adjust-btn absolute top-[15px] left-[15px] px-3 py-2 border-none rounded-xl text-sm font-medium leading-[1.4] z-100 transition-all duration-300 box-border h-auto min-h-auto inline-flex items-center justify-center whitespace-nowrap text-white shadow-[0_2px_5px_rgba(0,0,0,0.2)] max-[850px]:px-2.5 max-[850px]:py-[6px] max-[850px]:text-xs max-[850px]:top-2.5 max-[850px]:left-2.5"
      :class="isActive ? 'opacity-80 cursor-pointer' : 'opacity-0 pointer-events-none cursor-default'"
      @click.stop="handleAdjust"
    >Adjust</button>

    <button
      v-if="videoUrl"
      class="download-btn absolute top-[15px] right-[15px] px-3 py-2 border-none rounded-xl text-sm font-medium leading-[1.4] z-100 transition-all duration-300 box-border h-auto min-h-auto inline-flex items-center justify-center whitespace-nowrap bg-white text-gray-700 shadow-[0_2px_5px_rgba(0,0,0,0.2)] max-[850px]:px-2.5 max-[850px]:py-[6px] max-[850px]:text-xs max-[850px]:top-2.5 max-[850px]:right-2.5"
      :class="isActive ? 'opacity-80 cursor-pointer' : 'opacity-0 pointer-events-none cursor-default'"
      @click.stop="handleDownload"
    >Download</button>
  </div>
</template>

<style scoped>
.adjust-btn:hover,
.download-btn:hover {
  opacity: 1 !important;
  transform: scale(1.05);
}

.adjust-btn:active,
.download-btn:active {
  transform: scale(0.95);
}
</style>

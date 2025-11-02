<script setup lang="ts">
import { ref, watch } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ClipActionButton from './ClipActionButton.vue'
import ClipEditor from './ClipEditor.vue'
import SaveClipModal from './SaveClipModal.vue'
import { useClipAdjustment } from '@/composables/useClipAdjustment'
import { useClipActions } from '@/composables/useClipActions'
import type { ClipInfo } from '@/types/clip'

type Props = ClipInfo

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

const wasEditing = ref(false)
const showSaveModal = ref(false)
const isAdjustedSave = ref(false)

const {
  leftAdjust,
  rightAdjust,
  statusMessage,
  isUpdatingPreview,
  previewUrl,
  resetAdjustments,
  downloadAdjusted,
  saveAdjusted
} = useClipAdjustment({
  clipIndex: props.index,
  originalVideoUrl: props.videoUrl,
  isEditing: props.isEditing || false,
  searchQuery: props.searchQuery
})

const { download, save } = useClipActions({
  clipIndex: props.index,
  videoUrl: props.videoUrl,
  searchQuery: props.searchQuery
})

watch(() => props.isEditing, (editing, wasEditingBefore) => {
  if (editing) {
    resetAdjustments()
    wasEditing.value = false
  } else if (wasEditingBefore) {
    wasEditing.value = true
    setTimeout(() => {
      wasEditing.value = false
    }, 2000)
  }
})

const handleClick = (event: MouseEvent) => {
  emit('click', props.index, event)
}

const handleAdjust = () => {
  emit('adjust', props.index)
}

const handleDownload = async () => {
  try {
    await download()
  } catch (err: any) {
    console.error('Download failed:', err)
  }
}

const handleSave = async () => {
  document.querySelectorAll('video').forEach((video) => {
    video.pause()
  })

  isAdjustedSave.value = false
  showSaveModal.value = true
}

const handleLoaded = (event: Event) => {
  emit('loaded', event, props.index)
}

const handleCloseEditor = () => {
  resetAdjustments()
  emit('close-editor')
}

const handleDownloadAdjusted = async () => {
  await downloadAdjusted()
}

const handleSaveAdjusted = async () => {
  document.querySelectorAll('video').forEach((video) => {
    video.pause()
  })

  isAdjustedSave.value = true
  showSaveModal.value = true
}

const handleModalSave = async (clipName: string) => {
  showSaveModal.value = false

  try {
    if (isAdjustedSave.value) {
      const success = await saveAdjusted(clipName)
      if (success) {
        setTimeout(() => {
          handleCloseEditor()
        }, 1500)
      }
    } else {
      await save(clipName)
    }
  } catch (err: any) {
    console.error('Save failed:', err)
  }
}

const handleModalClose = () => {
  showSaveModal.value = false
}
</script>

<template>
  <div
    class="reel-item snap-center transition-all duration-500 flex-shrink-0 opacity-50 scale-85 w-auto min-w-auto max-w-none mx-5 p-0 relative flex items-center justify-center rounded-[32px] z-[1] max-[850px]:w-[90vw] max-[850px]:h-auto max-[850px]:max-w-[90vw] max-[850px]:my-2.5 max-[850px]:mx-0"
    :class="{
      'active opacity-100 scale-100': (isActive && !isEditing) || isEditing,
      'z-[1001]': isActive && !isEditing,
      'z-[1060]': isEditing,
      'was-editing': wasEditing,
      'cursor-pointer': !isEditing,
      'last-loaded z-[10] !opacity-75 !scale-90': isLastLoaded && !isActive && !isEditing,
      'clip-loaded': videoUrl || hasError,
      'clip-loading': !videoUrl && !hasError,
      'h-[50vh]': !isEditing,
      'h-auto': isEditing,
      'max-[850px]:h-auto': true
    }"
    :style="[
      isActive && !isEditing ? 'box-shadow: 0 0 32px rgba(242, 169, 76, 0.8);' : (isLastLoaded && !isActive ? 'box-shadow: 0 0 16px rgba(242, 169, 76, 0.4);' : ''),
      'border-radius: 32px;',
      isEditing ? 'pointer-events: auto;' : ''
    ].filter(s => s).join(' ')"
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
        playsinline
        preload="auto"
        :src="previewUrl || videoUrl"
        @loadeddata="handleLoaded"
        class="clip-video"
        :class="{ 'editing-video': isEditing }"
        :style="isActive && !isEditing ? 'box-shadow: 0 0 0 3px #f2a94c;' : ''"
      ></video>

      <Transition name="panel-slide">
        <ClipEditor
          v-if="isEditing"
          :clip-index="index"
          :left-adjust="leftAdjust"
          :right-adjust="rightAdjust"
          :status-message="statusMessage"
          :is-updating-preview="isUpdatingPreview"
          @update:left-adjust="leftAdjust = $event"
          @update:right-adjust="rightAdjust = $event"
          @close="handleCloseEditor"
          @download="handleDownloadAdjusted"
          @save="handleSaveAdjusted"
        />
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

    <SaveClipModal
      :show="showSaveModal"
      @close="handleModalClose"
      @save="handleModalSave"
    />
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
  opacity: 0;
  pointer-events: none;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.reel-item.active .adjust-btn,
.reel-item.active .download-btn,
.reel-item.active .save-btn {
  opacity: 0.8;
  pointer-events: auto;
}

.reel-item.z-\[1060\] .adjust-btn,
.reel-item.z-\[1060\] .download-btn,
.reel-item.z-\[1060\] .save-btn {
  opacity: 0;
  pointer-events: none;
}

.reel-item.was-editing.active .adjust-btn,
.reel-item.was-editing.active .download-btn,
.reel-item.was-editing.active .save-btn {
  transition: opacity 0.3s ease 1.6s;
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
  transform: translateY(-5vh) scale(1.08);
  filter: drop-shadow(0 0 50px rgba(242, 169, 76, 1));
}

@media (max-width: 850px) {
  .editing-wrapper {
    transform: translateY(0.5vh) scale(1.08);
  }
}

.clip-video {
  width: auto;
  height: auto;
  max-height: 50vh;
  object-fit: contain;
  border-radius: 32px;
  display: block;
  transition: all 0.5s ease;
}

@media (max-width: 850px) {
  .clip-video {
    max-height: 60vh;
    max-width: 90vw;
  }
}

.reel-item:not(.editing-wrapper) .clip-video {
  cursor: pointer;
}

.editing-video {
  max-height: 48vh;
  border-radius: 32px 32px 0 0;
  margin-bottom: 0;
}

@media (max-width: 850px) {
  .editing-video {
    max-height: 55vh;
  }
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

.reel-item[data-idx="0"]:not(.z-\[1006\]) {
  margin-left: 80px;
}

@media (max-width: 850px) {
  .reel-item[data-idx="0"]:not(.z-\[1006\]) {
    margin-left: 0;
    margin-top: 60px;
  }
}
</style>

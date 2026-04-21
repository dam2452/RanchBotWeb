<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import ClipActionButton from './ClipActionButton.vue'
import ClipEditor from './ClipEditor.vue'
import SaveClipModal from './SaveClipModal.vue'
import VideoPlayer from './VideoPlayer.vue'
import { useClipPreview } from '@/composables/useClipPreview'
import { useClipActions } from '@/composables/useClipActions'
import { useClipSave } from '@/composables/useClipSave'
import type { ClipInfo } from '@/types/clip'

type Props = ClipInfo

interface Emits {
  (e: 'click', index: number, event: MouseEvent): void
  (e: 'adjust', index: number): void
  (e: 'loaded', event: Event, index: number): void
  (e: 'close-editor'): void
  (e: 'load-video', index: number): void
  (e: 'pause-all'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const wasEditing = ref(false)
const playerRef = ref<InstanceType<typeof VideoPlayer> | null>(null)

const _videoRef = computed(() => playerRef.value?.videoRef ?? null)

const {
  leftAdjust,
  rightAdjust,
  statusMessage,
  isUpdatingPreview,
  previewUrl,
  resetAdjustments,
  validateAdjustment
} = useClipPreview({
  clipIndex: props.index,
  isEditing: () => props.isEditing || false,
  videoRef: _videoRef
})

const actions = useClipActions({
  clipIndex: props.index,
  videoUrl: props.videoUrl,
  searchQuery: props.searchQuery
})

const {
  showSaveModal,
  openSaveModal,
  closeModal,
  handleDownload,
  handleDownloadAdjusted,
  handleModalSave
} = useClipSave({
  download: actions.download,
  downloadAdjusted: actions.downloadAdjusted,
  save: actions.save,
  saveAdjusted: actions.saveAdjusted,
  leftAdjust,
  rightAdjust,
  statusMessage,
  validateAdjustment,
  resetAdjustments,
  onCloseEditor: () => emit('close-editor')
})

watch(() => props.isEditing, (editing, wasEditingBefore) => {
  if (editing) {
    resetAdjustments()
    wasEditing.value = false
  } else if (wasEditingBefore) {
    wasEditing.value = true
    setTimeout(() => { wasEditing.value = false }, 2000)
  }
})

const handleClick = (event: MouseEvent) => {
  if (!props.isActive) {
    emit('click', props.index, event)
    return
  }

  const player = playerRef.value
  if (!player) return

  if (props.thumbnailUrl && !player.shouldLoadVideo) {
    event.stopPropagation()
    player.triggerLoad()
    emit('load-video', props.index)
    return
  }

  if (player.shouldLoadVideo) {
    event.stopPropagation()
    player.togglePlayback()
    return
  }

  emit('click', props.index, event)
}
</script>

<template>
  <div
    class="reel-item"
    :class="{
      'active': (isActive && !isEditing) || isEditing,
      'z-active': isActive && !isEditing,
      'z-editing': isEditing,
      'was-editing': wasEditing,
      'clickable': !isEditing,
      'last-loaded': isLastLoaded && !isActive && !isEditing,
      'clip-loaded': videoUrl || hasError,
      'clip-loading': !videoUrl && !hasError,
      'not-editing': !isEditing,
      'editing-height': isEditing
    }"
    :data-idx="index"
    @click="handleClick"
  >
    <div v-if="!hasError" class="clip-wrapper" :class="{ 'editing-wrapper': isEditing }">
      <div class="video-container">
        <VideoPlayer
          ref="playerRef"
          :video-url="videoUrl"
          :thumbnail-url="thumbnailUrl"
          :preview-url="previewUrl"
          :is-active="isActive"
          :is-editing="isEditing ?? false"
          @click="handleClick"
          @loaded="emit('loaded', $event, index)"
        />

        <ClipActionButton v-if="!isEditing" variant="primary" position="top-left" size="medium" class="adjust-btn" @click="emit('adjust', index)">
          Adjust
        </ClipActionButton>

        <ClipActionButton v-if="!isEditing" variant="secondary" position="top-right" size="medium" class="download-btn" @click="handleDownload">
          Download
        </ClipActionButton>

        <ClipActionButton v-if="!isEditing" variant="success" position="bottom-left" size="medium" class="save-btn" @click="openSaveModal(false, () => emit('pause-all'))">
          Save
        </ClipActionButton>
      </div>

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
          @close="() => { resetAdjustments(); emit('close-editor') }"
          @download="handleDownloadAdjusted"
          @save="openSaveModal(true, () => emit('pause-all'))"
        />
      </Transition>
    </div>

    <div v-else class="error-state">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="error-title">Failed to load clip</p>
      <p class="error-subtitle">Clip #{{ index + 1 }} is unavailable</p>
    </div>

    <SaveClipModal :show="showSaveModal" @close="closeModal" @save="handleModalSave" />
  </div>
</template>

<style scoped lang="scss">
.reel-item {
  scroll-snap-align: center;
  transition: all 0.5s ease;
  flex-shrink: 0;
  width: calc(100vw - 20px);
  height: 100vh;
  max-width: calc(100vw - 20px);
  margin: 0;
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  z-index: 1;

  &.not-editing { height: 100vh; }
  &.editing-height { height: auto; }

  &:not(.active) {
    opacity: 1;
    transform: scale(1);
    pointer-events: none;
  }

  &.active {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  &.z-active { z-index: 1001; }
  &.z-editing { z-index: 1060; pointer-events: auto; }
  &.clickable { cursor: pointer; }

  &.last-loaded {
    z-index: 10;
    opacity: 0.75;
    transform: scale(0.9);
  }

  &.clip-loading { opacity: 0; pointer-events: none; }

  @include tablet {
    width: auto;
    height: 50vh;
    max-width: none;
    margin: 0 20px;
    border-radius: 32px;

    &:not(.active):not(.z-editing) {
      opacity: 0.5;
      transform: scale(0.85);
      pointer-events: auto;
    }

    &.active,
    &.z-editing {
      opacity: 1;
      transform: scale(1);
      box-shadow: none;
    }

    &.last-loaded { box-shadow: none; }
    &.editing-height { height: auto; }
  }
}

.reel-item.last-loaded :deep(.clip-video) {
  box-shadow: 0 0 16px rgba(242, 169, 76, 0.4);
}

.reel-item[data-idx="0"]:not(.z-editing) { margin-left: 0; margin-top: 0; }

@include tablet {
  .reel-item[data-idx="0"]:not(.z-editing),
  .reel-item[data-idx="0"].z-editing {
    margin-left: 20px;
    margin-top: 0;
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 16px;
  border-radius: 24px;
  text-align: center;
  background: #fee;
  color: #c33;
}

.error-icon { width: 64px; height: 64px; margin-bottom: 12px; }
.error-title { font-weight: 600; font-size: 18px; }
.error-subtitle { font-size: 14px; margin-top: 4px; }

.video-container .adjust-btn,
.video-container .download-btn,
.video-container .save-btn {
  opacity: 0;
  pointer-events: none;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.reel-item.active .video-container .adjust-btn,
.reel-item.active .video-container .download-btn,
.reel-item.active .video-container .save-btn {
  opacity: 0.8;
  pointer-events: auto;
}

.reel-item.z-editing .video-container .adjust-btn,
.reel-item.z-editing .video-container .download-btn,
.reel-item.z-editing .video-container .save-btn {
  opacity: 0;
  pointer-events: none;
}

.reel-item.was-editing.active .video-container .adjust-btn,
.reel-item.was-editing.active .video-container .download-btn,
.reel-item.was-editing.active .video-container .save-btn {
  transition: opacity 0.3s ease 1.6s;
}

.video-container .adjust-btn:hover,
.video-container .download-btn:hover,
.video-container .save-btn:hover {
  opacity: 1 !important;
}

.clip-wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  height: auto;
  transition: all 0.5s ease;
  box-sizing: border-box;
}

.editing-wrapper {
  position: relative;
  transform: translateY(0) scale(1);
  filter: none;

  @include tablet-down {
    padding-top: 200px;
  }

  @include tablet {
    transform: translateY(-5vh) scale(1.08);
    filter: drop-shadow(0 0 50px rgba(242, 169, 76, 1));
  }
}

.video-container {
  position: relative;
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;

  @include tablet {
    width: auto;
  }
}

.clip-wrapper {
  @include tablet {
    width: auto;
  }
}

.panel-slide-enter-active,
.panel-slide-leave-active { transition: all 0.3s ease; }

.panel-slide-enter-from,
.panel-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>

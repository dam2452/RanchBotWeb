<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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
  (e: 'load-video', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const wasEditing = ref(false)
const showSaveModal = ref(false)
const isAdjustedSave = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const isVideoLoading = ref(false)
const isVideoMuted = ref(isMobile)
const shouldLoadVideo = ref(false)
const thumbnailLoaded = ref(false)
const isVideoPlaying = ref(false)

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
  isEditing: () => props.isEditing || false,
  searchQuery: props.searchQuery,
  videoRef
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
  if (!props.isActive) {
    emit('click', props.index, event)
    return
  }

  if (props.thumbnailUrl && thumbnailLoaded.value) {
    event.stopPropagation()

    if (!shouldLoadVideo.value) {
      shouldLoadVideo.value = true
      isVideoLoading.value = true
      emit('load-video', props.index)

      if (isMobile && videoRef.value) {
        videoRef.value.muted = false
        isVideoMuted.value = false
      }
      return
    }

    if (videoRef.value) {
      if (isVideoPlaying.value) {
        videoRef.value.pause()
      } else {
        if (isMobile) {
          videoRef.value.muted = false
          isVideoMuted.value = false
        }
        videoRef.value.play().catch(() => {})
      }
    }
    return
  }
  emit('click', props.index, event)
}

const handleThumbnailLoaded = () => {
  thumbnailLoaded.value = true
  isVideoLoading.value = false
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

  if (videoRef.value) {
    videoRef.value.addEventListener('volumechange', () => {
      if (videoRef.value) {
        isVideoMuted.value = videoRef.value.muted
      }
    })
  }
}

const handleCanPlay = (event: Event) => {
  isVideoLoading.value = false

  if (shouldLoadVideo.value && videoRef.value && videoRef.value.paused) {
    if (isMobile) {
      videoRef.value.muted = false
      isVideoMuted.value = false
    }
    videoRef.value.play().catch(() => {})
    isVideoPlaying.value = true
  }
}

const handlePlaying = () => {
  isVideoPlaying.value = true
}

const handlePause = () => {
  isVideoPlaying.value = false
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

watch(() => props.videoUrl, (newUrl) => {
  if (newUrl && shouldLoadVideo.value) {
    isVideoLoading.value = true
  }
})

watch(() => previewUrl.value, () => {
  if (previewUrl.value) {
    isVideoLoading.value = true
  }
})

watch(() => props.isActive, (active) => {
  if (active && !shouldLoadVideo.value && thumbnailLoaded.value && props.videoUrl) {
    shouldLoadVideo.value = true
  }
})

watch(() => props.thumbnailUrl, (newThumbUrl) => {
  if (newThumbUrl && !shouldLoadVideo.value) {
    isVideoLoading.value = false
  }
})
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
    <div
      v-if="!hasError"
      class="clip-wrapper"
      :class="{ 'editing-wrapper': isEditing }"
    >
      <div class="video-container">
        <div class="video-wrapper">
          <div v-if="!videoUrl && !thumbnailLoaded" class="thumbnail-placeholder" :class="{ 'active-video': isActive && !isEditing }"></div>

          <img
            v-if="thumbnailUrl"
            v-show="!isVideoPlaying"
            :src="thumbnailUrl"
            @load="handleThumbnailLoaded"
            @click="handleClick"
            class="clip-video thumbnail-preview"
            :class="{
              'active-video': isActive && !isEditing
            }"
            alt="Video thumbnail"
          />

          <video
            v-if="videoUrl || shouldLoadVideo"
            v-show="!thumbnailUrl || isVideoPlaying"
            ref="videoRef"
            loop
            playsinline
            webkit-playsinline
            :muted="isMobile"
            preload="auto"
            :src="previewUrl || videoUrl"
            @click="handleClick"
            @loadeddata="handleLoaded"
            @canplay="handleCanPlay"
            @playing="handlePlaying"
            @pause="handlePause"
            class="clip-video"
            :class="{
              'editing-video': isEditing,
              'active-video': isActive && !isEditing
            }"
          ></video>

          <div v-if="isVideoLoading && shouldLoadVideo && !videoUrl" class="video-loading-overlay">
            <LoadingSpinner size="small" />
          </div>
        </div>

        <ClipActionButton
          v-if="!isEditing"
          variant="primary"
          position="top-left"
          size="medium"
          class="adjust-btn"
          @click="handleAdjust"
        >
          Adjust
        </ClipActionButton>

        <ClipActionButton
          v-if="!isEditing"
          variant="secondary"
          position="top-right"
          size="medium"
          class="download-btn"
          @click="handleDownload"
        >
          Download
        </ClipActionButton>

        <ClipActionButton
          v-if="!isEditing"
          variant="success"
          position="bottom-left"
          size="medium"
          class="save-btn"
          @click="handleSave"
        >
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
          @close="handleCloseEditor"
          @download="handleDownloadAdjusted"
          @save="handleSaveAdjusted"
        />
      </Transition>
    </div>

    <div v-else-if="hasError" class="error-state">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="error-title">Failed to load clip</p>
      <p class="error-subtitle">Clip #{{ index + 1 }} is unavailable</p>
    </div>

    <SaveClipModal
      :show="showSaveModal"
      @close="handleModalClose"
      @save="handleModalSave"
    />
  </div>
</template>

<style scoped>
.reel-item {
  scroll-snap-align: center;
  transition: all 0.5s ease;
  flex-shrink: 0;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  margin: 0;
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  z-index: 1;
}

.reel-item.not-editing {
  height: 100vh;
}

.reel-item.editing-height {
  height: auto;
}

.reel-item:not(.active) {
  opacity: 1;
  transform: scale(1);
  pointer-events: none;
}

.reel-item.active {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.reel-item.z-active {
  z-index: 1001;
}

.reel-item.z-editing {
  z-index: 1060;
  pointer-events: auto;
}

.reel-item.clickable {
  cursor: pointer;
}

.reel-item.last-loaded {
  z-index: 10;
  opacity: 0.75;
  transform: scale(0.9);
}

.reel-item.last-loaded .clip-video {
  box-shadow: 0 0 16px rgba(242, 169, 76, 0.4);
}

.reel-item.clip-loading {
  opacity: 0;
  pointer-events: none;
}

.error-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 16px;
  border-radius: 24px;
  text-align: center;
}

.error-state {
  background: #fee;
  color: #c33;
}

.error-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
}

.error-title {
  font-weight: 600;
  font-size: 18px;
}

.error-subtitle {
  font-size: 14px;
  margin-top: 4px;
}

.loading-state {
  background: #f5f5f5;
}

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
}

.video-container {
  position: relative;
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(2px);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.thumbnail-preview {
  cursor: pointer;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  max-width: 100vw;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.thumbnail-placeholder::after {
  content: '';
  position: absolute;
  width: 60px;
  height: 60px;
  border: 3px solid rgba(242, 169, 76, 0.3);
  border-radius: 50%;
  border-top-color: rgba(242, 169, 76, 0.8);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.clip-video {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  max-width: 100vw;
  object-fit: contain;
  border-radius: 24px;
  display: block;
  transition: all 0.5s ease;
  box-sizing: border-box;
}

.active-video {
  box-shadow:
    0 0 0 3px #f2a94c,
    0 0 40px rgba(242, 169, 76, 0.8);
}

.reel-item:not(.editing-wrapper) .clip-video {
  cursor: pointer;
}

.editing-video {
  max-height: 70vh;
  border-radius: 24px 24px 0 0;
  margin-bottom: 0;
}

@media (max-width: 850px) {
  .editing-wrapper {
    padding-top: 80px;
  }

  .editing-video {
    max-height: 50vh;
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

.reel-item[data-idx="0"]:not(.z-editing) {
  margin-left: 0;
  margin-top: 0;
}

@media (min-width: 851px) {
  .reel-item {
    width: auto;
    height: 50vh;
    max-width: none;
    margin: 0 20px;
    border-radius: 32px;
  }

  .reel-item:not(.active):not(.z-editing) {
    opacity: 0.5;
    transform: scale(0.85);
    pointer-events: auto;
  }

  .reel-item.active,
  .reel-item.z-editing {
    opacity: 1;
    transform: scale(1);
    box-shadow: none;
  }

  .active-video {
    box-shadow: 0 0 0 3px #f2a94c, 0 0 32px rgba(242, 169, 76, 0.8);
  }

  .reel-item.last-loaded {
    box-shadow: none;
  }

  .reel-item.last-loaded .clip-video {
    box-shadow: 0 0 16px rgba(242, 169, 76, 0.4);
  }

  .reel-item.editing-height {
    height: auto;
  }

  .clip-wrapper {
    width: auto;
  }

  .video-container {
    width: auto;
  }

  .clip-video {
    width: auto;
    height: auto;
    max-height: 50vh;
    max-width: none;
    border-radius: 32px;
  }

  .video-loading-overlay {
    border-radius: 32px;
  }

  .editing-wrapper {
    transform: translateY(-5vh) scale(1.08);
    filter: drop-shadow(0 0 50px rgba(242, 169, 76, 1));
  }

  .editing-video {
    max-height: 48vh;
    border-radius: 32px 32px 0 0;
  }

  .reel-item[data-idx="0"]:not(.z-editing) {
    margin-left: 20px;
    margin-top: 0;
  }

  .reel-item[data-idx="0"].z-editing {
    margin-left: 20px;
    margin-top: 0;
  }
}
</style>

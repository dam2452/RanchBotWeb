<script setup lang="ts">
import { ref } from 'vue'
import type { Clip } from '@/types'
import ClipActionButton from './ClipActionButton.vue'
import ConfirmModal from './ConfirmModal.vue'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  clip: Clip
  videoUrl: string
  isActive: boolean
  hasError?: boolean
}

interface Emits {
  (e: 'video-click', event: Event): void
  (e: 'download'): void
  (e: 'delete'): void
  (e: 'video-error'): void
}

const props = withDefaults(defineProps<Props>(), {
  hasError: false
})

const emit = defineEmits<Emits>()

const showDeleteConfirm = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const isLoading = ref(true)

const handleVideoClick = (event: Event) => {
  if (!props.hasError) {
    emit('video-click', event)
  }
}

const handleDownload = () => {
  emit('download')
}

const handleDelete = () => {
  document.querySelectorAll('video').forEach((video) => {
    video.pause()
  })

  showDeleteConfirm.value = true
}

const handleConfirmDelete = () => {
  showDeleteConfirm.value = false
  emit('delete')
}

const handleCancelDelete = () => {
  showDeleteConfirm.value = false
}

const handleVideoError = (event: Event) => {
  const videoElement = event.target as HTMLVideoElement
  const error = videoElement.error

  console.error('Video error for clip:', props.clip.id)
  console.error('URL:', props.videoUrl)
  console.error('Error code:', error?.code)
  console.error('Error message:', error?.message)
  console.error('Network state:', videoElement.networkState)
  console.error('Ready state:', videoElement.readyState)

  isLoading.value = false
  emit('video-error')
}

const handleVideoLoaded = () => {
  console.log('Video loaded:', props.clip.id)
  isLoading.value = false
}

</script>

<template>
  <div class="clip-card">
    <div class="video-container">
      <div v-if="!hasError" class="video-wrapper">
        <video
          ref="videoRef"
          loop
          playsinline
          muted
          preload="metadata"
          :src="videoUrl"
          class="clip-video"
          :class="{ active: isActive }"
          @click="handleVideoClick"
          @error="handleVideoError"
          @loadstart="() => console.log('Loading video:', clip.id)"
          @loadeddata="handleVideoLoaded"
        ></video>

        <div v-if="isLoading" class="loading-overlay">
          <LoadingSpinner size="small" />
        </div>
      </div>

      <div v-else class="error-placeholder">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        <p class="error-text">Can't play in browser</p>
        <p class="error-subtext">Try downloading</p>
      </div>

      <ClipActionButton
        variant="secondary"
        position="top-right"
        size="small"
        :class="['action-button', { 'error-download-button': hasError }]"
        @click="handleDownload"
      >
        Download
      </ClipActionButton>

      <ClipActionButton
        variant="danger"
        position="bottom-right"
        size="small"
        :class="['action-button', { 'error-delete-button': hasError }]"
        @click="handleDelete"
      >
        Delete
      </ClipActionButton>
    </div>

    <div class="clip-name">
      <p>{{ clip.name }}</p>
    </div>

    <ConfirmModal
      :show="showDeleteConfirm"
      title="Delete Clip"
      :message="`Are you sure you want to delete '${clip.name}'? This action cannot be undone.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="handleConfirmDelete"
      @close="handleCancelDelete"
    />
  </div>
</template>

<style scoped>
.clip-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  height: auto;
}

.video-container {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  min-height: 200px;
  max-height: 35vh;
  transition: all 0.3s;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(2px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.clip-video {
  width: 100%;
  height: auto;
  max-height: 35vh;
  object-fit: contain;
  border-radius: 12px;
  display: block;
  cursor: pointer;
  transition: all 0.3s;
}

.clip-video.active {
  box-shadow: 0 0 0 3px #f2a94c, 0 0 20px rgba(242, 169, 76, 0.6);
}

.error-placeholder {
  width: 100%;
  min-height: 200px;
  height: 100%;
  background: #1f2937;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #d1d5db;
  margin-bottom: 0.4rem;
}

.error-text {
  color: white;
  font-size: 0.85rem;
  font-weight: bold;
  margin: 0;
}

.error-subtext {
  color: #d1d5db;
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
}

.action-button {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.error-delete-button,
.error-download-button {
  opacity: 0.9 !important;
  pointer-events: auto !important;
}

.error-delete-button:hover,
.error-download-button:hover {
  opacity: 1 !important;
}

.video-container:hover .action-button {
  opacity: 0.8;
  pointer-events: auto;
}

.action-button:hover {
  opacity: 1;
}

.clip-name {
  display: inline-block;
  align-self: center;
  border-radius: 10px;
  padding: 0.4rem 0.8rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  background: linear-gradient(145deg, #aaaaaa, #999999);
  max-width: 90%;
}

.clip-name p {
  color: white;
  font-size: 0.95rem;
  font-weight: bold;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 851px) {
  .clip-card {
    gap: 0.5rem;
    height: 100%;
  }

  .video-container {
    border-radius: 16px;
    min-height: initial;
    max-height: none;
  }

  .clip-video {
    height: 100%;
    max-height: none;
    object-fit: cover;
    border-radius: 16px;
  }

  .loading-overlay {
    border-radius: 16px;
  }

  .error-placeholder {
    min-height: initial;
    border-radius: 16px;
  }

  .error-icon {
    width: 4rem;
    height: 4rem;
    margin-bottom: 0.75rem;
  }

  .error-text {
    font-size: 1rem;
  }

  .clip-name {
    padding: 0.5rem 1.25rem;
    border-radius: 12px;
  }

  .clip-name p {
    font-size: 1.125rem;
  }
}
</style>

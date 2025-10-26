<script setup lang="ts">
import type { Clip } from '@/types'
import ClipActionButton from './ClipActionButton.vue'

interface Props {
  clip: Clip
  videoUrl: string
  isActive: boolean
  hasError?: boolean
}

interface Emits {
  (e: 'video-click', event: Event): void
  (e: 'download', event: Event): void
  (e: 'delete', event: Event): void
  (e: 'video-error'): void
}

const props = withDefaults(defineProps<Props>(), {
  hasError: false
})

const emit = defineEmits<Emits>()

const handleVideoClick = (event: Event) => {
  if (!props.hasError) {
    emit('video-click', event)
  }
}

const handleDownload = (event: Event) => {
  emit('download', event)
}

const handleDelete = (event: Event) => {
  emit('delete', event)
}

const handleVideoError = (event: Event) => {
  console.error('Video error for clip:', props.clip.id, 'URL:', props.videoUrl, event)
  emit('video-error')
}
</script>

<template>
  <div class="clip-card">
    <div class="video-container">
      <video
        v-if="!hasError"
        loop
        muted
        playsinline
        :src="videoUrl"
        class="clip-video"
        :class="{ active: isActive }"
        @click="handleVideoClick"
        @error="handleVideoError"
        @loadstart="() => console.log('Loading video:', clip.id)"
        @loadeddata="() => console.log('Video loaded:', clip.id)"
      ></video>

      <div v-else class="error-placeholder">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        <p class="error-text">Clip unavailable</p>
      </div>

      <ClipActionButton
        v-if="!hasError"
        variant="secondary"
        position="top-right"
        size="small"
        class="action-button"
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
  </div>
</template>

<style scoped>
.clip-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.video-container {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  transition: all 0.3s;
}

.clip-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  display: block;
  cursor: pointer;
  transition: all 0.3s;
}

.clip-video.active {
  box-shadow: 0 0 0 3px #f2a94c, 0 0 20px rgba(242, 169, 76, 0.6);
}

.error-placeholder {
  width: 100%;
  height: 100%;
  background: #1f2937;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-icon {
  width: 4rem;
  height: 4rem;
  color: #d1d5db;
  margin-bottom: 0.75rem;
}

.error-text {
  color: white;
  font-size: 1rem;
  font-weight: bold;
  margin: 0;
}

.action-button {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.error-delete-button {
  opacity: 0.9 !important;
  pointer-events: auto !important;
}

.error-delete-button:hover {
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
  border-radius: 12px;
  padding: 0.5rem 1.25rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  background: linear-gradient(145deg, #aaaaaa, #999999);
  max-width: 90%;
}

.clip-name p {
  color: white;
  font-size: 1.125rem;
  font-weight: bold;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 850px) {
  .clip-card {
    gap: 0.2rem;
  }

  .video-container {
    border-radius: 8px;
  }

  .clip-video {
    border-radius: 8px;
  }

  .clip-name {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
  }

  .clip-name p {
    font-size: 0.7rem;
  }

  .error-icon {
    width: 2rem;
    height: 2rem;
    margin-bottom: 0.25rem;
  }

  .error-text {
    font-size: 0.7rem;
  }
}
</style>

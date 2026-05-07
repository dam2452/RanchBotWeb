<script setup lang="ts">
import type { Clip } from '@/types'
import ClipActionButton from './ClipActionButton.vue'
import ConfirmModal from '../common/ConfirmModal.vue'
import VideoPlayer from './VideoPlayer.vue'

interface Props {
  clip: Clip
  videoUrl: string
  thumbnailUrl?: string
  isActive: boolean
  hasError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasError: false
})

const emit = defineEmits<{
  (e: 'video-click', event: Event): void
  (e: 'download'): void
  (e: 'delete'): void
  (e: 'video-error'): void
}>()

const showDeleteConfirm = defineModel<boolean>('showDeleteConfirm', { default: false })

const _handleDeleteClick = (): void => {
  document.querySelectorAll('video').forEach((v: HTMLVideoElement) => v.pause())
  showDeleteConfirm.value = true
}
</script>

<template>
  <div class="clip-card" :data-clip-id="clip.id">
    <div class="video-container" :class="{ 'active': isActive }">
      <div class="video-wrapper">
        <VideoPlayer
          v-if="!hasError"
          :video-url="videoUrl"
          :thumbnail-url="thumbnailUrl"
          :preview-url="null"
          :is-active="isActive"
          :is-editing="false"
          :load-on-active="false"
          @click="emit('video-click', $event)"
        />

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
          class="action-button"
          @click="emit('download')"
        >
          Download
        </ClipActionButton>

        <ClipActionButton
          variant="danger"
          position="bottom-right"
          size="small"
          class="action-button"
          @click="_handleDeleteClick"
        >
          Delete
        </ClipActionButton>
      </div>
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
      @confirm="showDeleteConfirm = false; emit('delete')"
      @close="showDeleteConfirm = false"
    />
  </div>
</template>

<style scoped lang="scss">
.clip-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  height: auto;

  @include tablet {
    gap: 0.5rem;
    height: 100%;
    min-height: 0;
  }
}

.video-container {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 200px;
  max-height: 35vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: $border-radius-video;

  @include tablet {
    flex: 1;
    width: auto;
    min-height: 0;
    max-height: none;
    border-radius: $border-radius-video-tablet;
  }
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $border-radius-video;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 3px solid transparent;
    pointer-events: none;
    transition: border-color 0.3s ease;
    z-index: 1;
  }

  @include tablet {
    width: 100%;
    height: 100%;
    border-radius: $border-radius-video-tablet;
  }
}

.video-container.active .video-wrapper::after {
  border-color: $active-frame-color;
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

  @include tablet {
    min-height: initial;
    border-radius: 16px;
  }
}

.error-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #d1d5db;
  margin-bottom: 0.4rem;

  @include tablet {
    width: 4rem;
    height: 4rem;
    margin-bottom: 0.75rem;
  }
}

.error-text {
  color: white;
  font-size: 0.85rem;
  font-weight: bold;
  margin: 0;

  @include tablet {
    font-size: 1rem;
  }
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

.video-wrapper:hover .action-button {
  opacity: 0.8;
  pointer-events: auto;
}

@media (hover: none) {
  .action-button {
    opacity: 0.75;
    pointer-events: auto;
  }
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

  @include tablet {
    padding: 0.5rem 1.25rem;
    border-radius: 12px;
  }

  p {
    color: white;
    font-size: 0.95rem;
    font-weight: bold;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @include tablet {
      font-size: 1.125rem;
    }
  }
}
</style>

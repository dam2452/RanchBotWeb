<script setup lang="ts">
import { ref, watch } from 'vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import { IS_MOBILE } from '@/utils/formatters'

interface Props {
  videoUrl: string | undefined
  thumbnailUrl: string | undefined
  previewUrl: string | null | undefined
  isActive: boolean
  isEditing: boolean
  loadOnActive?: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
  (e: 'loaded', event: Event): void
  (e: 'thumbnail-loaded'): void
  (e: 'playing'): void
  (e: 'paused'): void
}

const props = withDefaults(defineProps<Props>(), {
  loadOnActive: true,
})
const emit = defineEmits<Emits>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isVideoLoading = ref(false)
const isVideoMuted = ref(IS_MOBILE)
const shouldLoadVideo = ref(false)
const thumbnailLoaded = ref(false)
const isVideoPlaying = ref(false)

const _unmute = () => {
  if (IS_MOBILE && videoRef.value) {
    videoRef.value.muted = false
    isVideoMuted.value = false
  }
}

const triggerLoad = () => {
  shouldLoadVideo.value = true
  isVideoLoading.value = true
  _unmute()
}

const _handleThumbnailClick = (event: MouseEvent) => {
  if (!props.loadOnActive && !shouldLoadVideo.value) triggerLoad()
  emit('click', event)
}

const togglePlayback = () => {
  if (!videoRef.value) return
  if (isVideoPlaying.value) {
    videoRef.value.pause()
  } else {
    _unmute()
    videoRef.value.play().catch(() => {})
  }
}

const handleThumbnailLoaded = () => {
  thumbnailLoaded.value = true
  isVideoLoading.value = false
  emit('thumbnail-loaded')
}

const handleLoaded = (event: Event) => {
  emit('loaded', event)
}

const handleCanPlay = () => {
  isVideoLoading.value = false
  if (!props.isActive || !shouldLoadVideo.value || !videoRef.value?.paused) return
  _unmute()
  videoRef.value.play().catch(() => {})
  isVideoPlaying.value = true
}

const handlePlaying = () => {
  isVideoPlaying.value = true
  emit('playing')
}

const handlePause = () => {
  isVideoPlaying.value = false
  emit('paused')
}

const handleVideoError = () => {
  isVideoLoading.value = false
  isVideoPlaying.value = false
}

watch(() => props.videoUrl, (newUrl) => {
  if (newUrl && shouldLoadVideo.value) isVideoLoading.value = true
})

watch(() => props.previewUrl, (newUrl) => {
  if (newUrl) isVideoLoading.value = true
})

watch(() => props.isActive, (active) => {
  if (active && props.loadOnActive && !shouldLoadVideo.value && thumbnailLoaded.value && props.videoUrl) {
    shouldLoadVideo.value = true
  } else if (!active && videoRef.value) {
    videoRef.value.pause()
    isVideoPlaying.value = false
  }
})

watch(() => props.thumbnailUrl, (newUrl) => {
  if (newUrl && !shouldLoadVideo.value) isVideoLoading.value = false
})

watch(videoRef, (video, _, onCleanup) => {
  if (!video) return
  const onVolumeChange = () => { isVideoMuted.value = video.muted }
  video.addEventListener('volumechange', onVolumeChange)
  onCleanup(() => video.removeEventListener('volumechange', onVolumeChange))

  if (!props.loadOnActive && props.isActive && shouldLoadVideo.value) {
    if (IS_MOBILE) video.muted = false
    video.play().catch(() => {})
  }
})

defineExpose({ videoRef, isVideoPlaying, shouldLoadVideo, isVideoMuted, triggerLoad, togglePlayback })
</script>

<template>
  <div class="video-wrapper">
    <div
      v-if="!videoUrl && !thumbnailLoaded"
      class="thumbnail-placeholder"
    ></div>

    <img
      v-if="thumbnailUrl"
      v-show="!isVideoPlaying"
      :src="thumbnailUrl"
      class="clip-video thumbnail-preview"
      :class="{ 'editing-video': isEditing }"
      alt="Video thumbnail"
      @load="handleThumbnailLoaded"
      @click="_handleThumbnailClick"
    />

    <video
      v-if="shouldLoadVideo || (loadOnActive && videoUrl)"
      v-show="!thumbnailUrl || isVideoPlaying"
      ref="videoRef"
      loop
      playsinline
      webkit-playsinline
      :muted="IS_MOBILE"
      preload="metadata"
      :src="previewUrl || videoUrl"
      class="clip-video"
      :class="{ 'editing-video': isEditing }"
      @click="emit('click', $event)"
      @loadeddata="handleLoaded"
      @canplay="handleCanPlay"
      @playing="handlePlaying"
      @pause="handlePause"
      @error="handleVideoError"
    ></video>

    <div v-if="isVideoLoading && shouldLoadVideo" class="video-loading-overlay">
      <LoadingSpinner size="small" />
    </div>

    <div v-if="thumbnailLoaded && !videoUrl && !shouldLoadVideo" class="video-fetching-badge">
      <span class="fetching-dot"></span>
    </div>
  </div>
</template>

<style scoped lang="scss">
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

.video-fetching-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  padding: 4px 8px;
  pointer-events: none;
  z-index: 10;

  &::after {
    content: 'Ładowanie wideo…';
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
  }
}

.fetching-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse-dot 1.2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

.thumbnail-preview {
  cursor: pointer;
}

@include tablet {
  .video-fetching-badge {
    bottom: 14px;
    right: 14px;
  }
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  max-width: calc(100vw - 20px);
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    width: 60px;
    height: 60px;
    border: 3px solid rgba(242, 169, 76, 0.3);
    border-radius: 50%;
    border-top-color: rgba(242, 169, 76, 0.8);
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.clip-video {
  width: 100%;
  height: auto;
  max-height: 35vh;
  max-width: calc(100vw - 20px);
  object-fit: contain;
  border-radius: $border-radius-video;
  display: block;
  transition: all 0.5s ease;
  box-sizing: border-box;
  cursor: pointer;
}

.editing-video {
  max-height: 70vh;
  border-radius: 24px 24px 0 0;
  margin-bottom: 0;

  @include tablet-down {
    max-height: 50vh;
  }

  @include tablet {
    max-height: 48vh;
    border-radius: 32px 32px 0 0;
  }
}

@include tablet {
  .video-wrapper {
    width: 100%;
    height: 100%;
  }

  .clip-video {
    width: 100%;
    height: 100%;
    max-height: 100%;
    max-width: 100%;
    border-radius: $border-radius-video-tablet;
    object-fit: cover;
  }

  .clip-video.editing-video {
    border-radius: $border-radius-video-tablet $border-radius-video-tablet 0 0;
  }

  .video-loading-overlay {
    border-radius: $border-radius-video-tablet;
  }
}
</style>

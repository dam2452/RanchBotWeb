<script setup lang="ts">
import { ref, watch } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { IS_MOBILE } from '@/utils/formatters'

interface Props {
  videoUrl: string | undefined
  thumbnailUrl: string | undefined
  previewUrl: string | null | undefined
  isActive: boolean
  isEditing: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
  (e: 'loaded', event: Event): void
  (e: 'thumbnail-loaded'): void
  (e: 'playing'): void
  (e: 'paused'): void
}

const props = defineProps<Props>()
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

watch(() => props.videoUrl, (newUrl) => {
  if (newUrl && shouldLoadVideo.value) isVideoLoading.value = true
})

watch(() => props.previewUrl, (newUrl) => {
  if (newUrl) isVideoLoading.value = true
})

watch(() => props.isActive, (active) => {
  if (active && !shouldLoadVideo.value && thumbnailLoaded.value && props.videoUrl) {
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
})

defineExpose({ videoRef, isVideoPlaying, shouldLoadVideo, isVideoMuted, triggerLoad, togglePlayback })
</script>

<template>
  <div class="video-wrapper">
    <div
      v-if="!videoUrl && !thumbnailLoaded"
      class="thumbnail-placeholder"
      :class="{ 'active-video': isActive && !isEditing }"
    ></div>

    <img
      v-if="thumbnailUrl"
      v-show="!isVideoPlaying"
      :src="thumbnailUrl"
      class="clip-video thumbnail-preview"
      :class="{ 'editing-video': isEditing, 'active-video': isActive && !isEditing }"
      alt="Video thumbnail"
      @load="handleThumbnailLoaded"
      @click="emit('click', $event)"
    />

    <video
      v-if="videoUrl || shouldLoadVideo"
      v-show="!thumbnailUrl || isVideoPlaying"
      ref="videoRef"
      loop
      playsinline
      webkit-playsinline
      :muted="IS_MOBILE"
      preload="auto"
      :src="previewUrl || videoUrl"
      class="clip-video"
      :class="{ 'editing-video': isEditing, 'active-video': isActive && !isEditing }"
      @click="emit('click', $event)"
      @loadeddata="handleLoaded"
      @canplay="handleCanPlay"
      @playing="handlePlaying"
      @pause="handlePause"
    ></video>

    <div v-if="isVideoLoading && shouldLoadVideo && !videoUrl" class="video-loading-overlay">
      <LoadingSpinner size="small" />
    </div>
  </div>
</template>

<style scoped>
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
  max-width: calc(100vw - 20px);
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
  max-width: calc(100vw - 20px);
  object-fit: contain;
  border-radius: 24px;
  display: block;
  transition: all 0.5s ease;
  box-sizing: border-box;
  cursor: pointer;
}

.active-video {
  box-shadow: 0 0 0 3px #f2a94c, 0 0 40px rgba(242, 169, 76, 0.8);
}

.editing-video {
  max-height: 70vh;
  border-radius: 24px 24px 0 0;
  margin-bottom: 0;
}

@media (max-width: 850px) {
  .editing-video {
    max-height: 50vh;
  }
}

@media (min-width: 851px) {
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

  .editing-video {
    max-height: 48vh;
    border-radius: 32px 32px 0 0;
  }
}
</style>

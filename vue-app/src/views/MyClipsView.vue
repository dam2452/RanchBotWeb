<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiService } from '@/services/api'
import type { Clip } from '@/types'
import UserButtons from '@/components/UserButtons.vue'

const clips = ref<Clip[]>([])
const loading = ref(true)
const error = ref('')
const currentPage = ref(0)
const activeClipId = ref<string | null>(null)

const clipsPerPage = 6

onMounted(async () => {
  await loadClips()
})

const loadClips = async () => {
  loading.value = true
  error.value = ''

  try {
    clips.value = await apiService.getUserClips()
  } catch (err: any) {
    error.value = err.message || 'Failed to load clips'
  } finally {
    loading.value = false
  }
}

const totalPages = computed(() => Math.ceil(clips.value.length / clipsPerPage))

const getClipsForPage = (pageIndex: number) => {
  const start = pageIndex * clipsPerPage
  const end = start + clipsPerPage
  return clips.value.slice(start, end)
}

const handleDelete = async (clipName: string, event: Event) => {
  event.stopPropagation()
  if (!confirm(`Are you sure you want to delete the clip "${clipName}"?`)) {
    return
  }

  try {
    await apiService.deleteClip(clipName)
    clips.value = clips.value.filter((clip) => clip.name !== clipName)
  } catch (err: any) {
    alert('Failed to delete clip: ' + err.message)
  }
}

const handleDownload = async (clip: Clip, event: Event) => {
  event.stopPropagation()
  try {
    const a = document.createElement('a')
    a.href = apiService.getVideoUrl(clip.id)
    a.download = `${clip.name}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err: any) {
    alert('Failed to download clip: ' + err.message)
  }
}

const getVideoUrl = (clipId: string) => {
  return apiService.getVideoUrl(clipId)
}

const handleVideoClick = (clip: Clip, event: Event) => {
  const video = (event.target as HTMLVideoElement)

  if (activeClipId.value === clip.id) {
    video.pause()
    activeClipId.value = null
  } else {
    document.querySelectorAll('.clip-video').forEach((v) => {
      (v as HTMLVideoElement).pause()
    })

    activeClipId.value = clip.id
    video.play().catch(() => {})
  }
}
</script>

<template>
  <div class="my-clips-container">
    <UserButtons fixed :show-my-clips="false" />

    <div v-if="loading" class="loading-screen">
      <div class="spinner-large"></div>
      <p class="loading-text">Loading clips...</p>
    </div>

    <div v-else-if="error" class="error-screen">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="clips.length === 0" class="empty-screen">
      <p>You don't have any clips yet. Use the quote search to create your first clips!</p>
    </div>

    <div v-else class="carousel-container">
      <div
        v-for="pageIndex in totalPages"
        :key="`page-${pageIndex}`"
        class="page"
      >
        <div class="grid-container">
          <div
            v-for="clip in getClipsForPage(pageIndex - 1)"
            :key="clip.id"
            class="clip-item"
          >
            <div class="video-wrapper" :class="{ active: activeClipId === clip.id }">
              <video
                loop
                muted
                playsinline
                :src="getVideoUrl(clip.id)"
                class="clip-video"
                @click="(e) => handleVideoClick(clip, e)"
              ></video>

              <button
                @click="(e) => handleDownload(clip, e)"
                class="btn-download"
              >
                Download
              </button>

              <button
                @click="(e) => handleDelete(clip.name, e)"
                class="btn-delete"
              >
                Delete
              </button>
            </div>

            <div class="clip-name">
              <p>{{ clip.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.my-clips-container body {
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

.my-clips-container #app {
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}
</style>

<style scoped>
.my-clips-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
  font-weight: 600;
}

.loading-screen,
.error-screen,
.empty-screen {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

.loading-text {
  margin-top: 20px;
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  font-weight: 700;
}

.error-screen p {
  color: #dc2626;
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  font-weight: 700;
}

.empty-screen p {
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  font-weight: 700;
  max-width: 600px;
}

.carousel-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.carousel-container::-webkit-scrollbar {
  display: none;
}

.page {
  flex-shrink: 0;
  width: calc(100vw - 150px);
  height: 100vh;
  scroll-snap-align: start;
  padding: 80px 40px 40px 40px;
  margin-right: 30px;
  box-sizing: border-box;
}

.page:first-child {
  margin-left: 75px;
}

.page:last-child {
  margin-right: 75px;
}

.grid-container {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 30px;
}

.clip-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 0;
  overflow: hidden;
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.clip-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 24px;
  display: block;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-wrapper.active .clip-video {
  border: 3px solid #ffb85c;
  box-shadow: 0 0 20px rgba(255, 184, 92, 0.6);
}

.btn-download {
  position: absolute;
  top: 25px;
  right: 25px;
  padding: 8px 14px;
  background: rgba(170, 170, 170, 0.9);
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.4;
  border: none;
  border-radius: 8px;
  cursor: default;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  z-index: 100;
  opacity: 0.7;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.video-wrapper.active .btn-download {
  opacity: 1;
  pointer-events: auto;
  cursor: pointer;
}

.video-wrapper.active .btn-download:hover {
  transform: scale(1.05);
}

.video-wrapper.active .btn-download:active {
  transform: scale(0.95);
}

.btn-delete {
  position: absolute;
  bottom: 25px;
  right: 25px;
  padding: 8px 14px;
  background: linear-gradient(to bottom right, #ef4444, #dc2626);
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.4;
  border: none;
  border-radius: 8px;
  cursor: default;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  z-index: 100;
  opacity: 0.7;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.video-wrapper.active .btn-delete {
  opacity: 1;
  pointer-events: auto;
  cursor: pointer;
}

.video-wrapper.active .btn-delete:hover {
  transform: scale(1.05);
}

.video-wrapper.active .btn-delete:active {
  transform: scale(0.95);
}

.clip-name {
  margin-top: 12px;
  background: white;
  border-radius: 25px;
  padding: 10px 20px;
  text-align: center;
  max-width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.clip-name p {
  font-size: clamp(0.9rem, 1.8vw, 1.2rem);
  font-weight: 700;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
}

.spinner-large {
  border: 8px solid #f3f3f3;
  border-top: 8px solid #ffb85c;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
}

@media (max-width: 850px) {
  .page {
    width: 90vw;
    padding: 70px 20px 20px 20px;
    margin-right: 20px;
  }

  .page:first-child {
    margin-left: 5vw;
  }

  .page:last-child {
    margin-right: 5vw;
  }

  .grid-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 1fr);
    gap: 20px;
  }

  .clip-name p {
    font-size: 0.9rem;
  }

  .btn-download {
    top: 10px;
    right: 10px;
    padding: 6px 10px;
    font-size: 0.75rem;
  }

  .btn-delete {
    bottom: 10px;
    right: 10px;
    padding: 6px 10px;
    font-size: 0.75rem;
  }
}
</style>

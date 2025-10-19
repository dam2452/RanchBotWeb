<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiService } from '@/services/api'
import type { Clip } from '@/types'
import UserButtons from '@/components/UserButtons.vue'
import SiteLogo from '@/components/SiteLogo.vue'
import SearchButton from '@/components/SearchButton.vue'

const clips = ref<Clip[]>([])
const loading = ref(true)
const error = ref('')

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

const handleDelete = async (clipName: string) => {
  if (!confirm(`Are you sure you want to delete the clip "${clipName}"? This action cannot be undone.`)) {
    return
  }

  try {
    await apiService.deleteClip(clipName)
    clips.value = clips.value.filter((clip) => clip.name !== clipName)
  } catch (err: any) {
    alert('Failed to delete clip: ' + err.message)
  }
}

const getVideoUrl = (clipId: string) => {
  return apiService.getVideoUrl(clipId)
}

const handleVideoPlay = (event: Event) => {
  const video = event.target as HTMLVideoElement
  const container = video.closest('.video-container')

  // Pause all other videos
  document.querySelectorAll('.clip-card video').forEach((v) => {
    if (v !== video) {
      (v as HTMLVideoElement).pause()
    }
  })

  // Remove active class from all containers
  document.querySelectorAll('.video-container').forEach((c) => {
    c.classList.remove('active')
  })

  // Add active class to current container
  container?.classList.add('active')
}

const handleVideoPause = (event: Event) => {
  const video = event.target as HTMLVideoElement
  const container = video.closest('.video-container')
  container?.classList.remove('active')
}
</script>

<template>
  <main class="my-clips-page">
    <!-- Logo and Site Name -->
    <SiteLogo />

    <!-- Header -->
    <div class="my-clips-header">
      <h1>My Clips</h1>
    </div>

    <!-- Search Button -->
    <SearchButton />

    <!-- User Buttons -->
    <UserButtons fixed :show-my-clips="false" :show-tooltip="false" />

    <!-- Loading -->
    <div v-if="loading" id="loading-indicator">
      <div class="spinner"></div>
      <div style="margin-top: 15px; font-weight: bold">Loading clips...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <!-- No clips -->
    <div v-else-if="clips.length === 0" class="no-clips-message">
      You don't have any clips yet. Use the quote search to create your first clips!
    </div>

    <!-- Clips Reel -->
    <div v-else class="clips-reel">
      <div v-for="clip in clips" :key="clip.id" class="clip-card">
        <div class="video-container">
          <video
            controls
            preload="metadata"
            :src="getVideoUrl(clip.id)"
            @play="handleVideoPlay"
            @pause="handleVideoPause"
          ></video>
        </div>

        <div class="quote">{{ clip.name }}</div>

        <button class="delete-clip-btn" @click="handleDelete(clip.name)">Delete</button>
      </div>
    </div>
  </main>
</template>

<style>
@import '@/assets/styles/css/pages/my-clips.css';
@import '@/assets/styles/css/components/clip-card.css';
@import '@/assets/styles/css/components/video-container.css';
@import '@/assets/styles/css/components/buttons.css';
</style>

<style scoped>

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

#loading-indicator {
  text-align: center;
  padding: 3rem;
}

.error-message,
.no-clips-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error-message {
  color: red;
}
</style>

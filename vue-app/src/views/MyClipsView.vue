<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiService } from '@/services/api'
import type { Clip } from '@/types'

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

const handleDownload = (clipId: string, clipName: string) => {
  const url = getVideoUrl(clipId)
  const a = document.createElement('a')
  a.href = url
  a.download = `${clipName}.mp4`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<template>
  <main class="my-clips-page">
    <div class="my-clips-header">
      <h1>My Clips</h1>
    </div>

    <div v-if="loading" id="loading-indicator">
      <div class="spinner"></div>
      <div style="margin-top: 15px; font-weight: bold">Loading clips...</div>
    </div>

    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else-if="clips.length === 0" class="no-clips-message">
      You don't have any clips yet. Use the quote search to create your first clips!
    </div>

    <div v-else class="clips-reel">
      <div v-for="clip in clips" :key="clip.id" class="clip-card">
        <video controls preload="metadata" :src="getVideoUrl(clip.id)"></video>

        <div class="clip-info">
          <h3>{{ clip.name }}</h3>
          <p class="clip-date">{{ new Date(clip.created_at).toLocaleDateString() }}</p>
        </div>

        <div class="clip-actions">
          <button class="download-btn" @click="handleDownload(clip.id, clip.name)">
            Download
          </button>
          <button class="delete-clip-btn" @click="handleDelete(clip.name)">Delete</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import '@/assets/styles/css/pages/my-clips.css';
@import '@/assets/styles/css/components/clip-card.css';

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

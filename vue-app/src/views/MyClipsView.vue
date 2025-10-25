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
  <div class="fixed top-0 left-0 w-screen h-screen m-0 p-0 overflow-hidden font-sans font-semibold">
    <UserButtons fixed :show-my-clips="false" />

    <div v-if="loading" class="w-screen h-screen flex flex-col items-center justify-center text-center p-5">
      <div class="border-8 border-[#f3f3f3] border-t-accent rounded-full w-[120px] h-[120px] animate-spin"></div>
      <p class="mt-5 text-[clamp(1.2rem,2.5vw,1.8rem)] font-bold">Loading clips...</p>
    </div>

    <div v-else-if="error" class="w-screen h-screen flex flex-col items-center justify-center text-center p-5">
      <p class="text-error text-[clamp(1.2rem,2.5vw,1.8rem)] font-bold">{{ error }}</p>
    </div>

    <div v-else-if="clips.length === 0" class="w-screen h-screen flex flex-col items-center justify-center text-center p-5">
      <p class="text-[clamp(1.2rem,2.5vw,1.8rem)] font-bold max-w-[600px]">You don't have any clips yet. Use the quote search to create your first clips!</p>
    </div>

    <div v-else class="flex w-screen h-screen overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div
        v-for="pageIndex in totalPages"
        :key="`page-${pageIndex}`"
        class="flex-shrink-0 w-[calc(100vw-150px)] h-screen snap-start pt-20 px-10 pb-10 mr-7.5 box-border first:ml-[75px] last:mr-[75px] max-[850px]:w-[90vw] max-[850px]:pt-[70px] max-[850px]:px-5 max-[850px]:pb-5 max-[850px]:mr-5 max-[850px]:first:ml-[5vw] max-[850px]:last:mr-[5vw]"
      >
        <div class="w-full h-full grid grid-cols-3 grid-rows-2 gap-7.5 max-[1200px]:grid-cols-2 max-[1200px]:grid-rows-3 max-[850px]:grid-cols-1 max-[850px]:grid-rows-6 max-[850px]:gap-5">
          <div
            v-for="clip in getClipsForPage(pageIndex - 1)"
            :key="clip.id"
            class="flex flex-col items-center justify-start min-h-0 overflow-hidden"
          >
            <div class="relative w-full aspect-video flex items-center justify-center overflow-hidden group" :class="{ 'active-clip': activeClipId === clip.id }">
              <video
                loop
                muted
                playsinline
                :src="getVideoUrl(clip.id)"
                class="w-full h-full object-cover rounded-[24px] block cursor-pointer transition-all duration-300"
                :class="{ 'border-[3px] border-accent shadow-[0_0_20px_rgba(255,184,92,0.6)]': activeClipId === clip.id }"
                @click="(e) => handleVideoClick(clip, e)"
              ></video>

              <button
                @click="(e) => handleDownload(clip, e)"
                class="absolute top-[25px] right-[25px] p-[8px_14px] bg-[rgba(170,170,170,0.9)] text-white font-medium text-sm leading-[1.4] border-none rounded-s cursor-default transition-all duration-300 shadow-[0_2px_5px_rgba(0,0,0,0.3)] z-100 opacity-70 pointer-events-none font-sans inline-flex items-center justify-center whitespace-nowrap max-[850px]:top-2.5 max-[850px]:right-2.5 max-[850px]:p-[6px_10px] max-[850px]:text-xs group-[.active-clip]:opacity-100 group-[.active-clip]:pointer-events-auto group-[.active-clip]:cursor-pointer hover:scale-105 active:scale-95"
              >
                Download
              </button>

              <button
                @click="(e) => handleDelete(clip.name, e)"
                class="absolute bottom-[25px] right-[25px] p-[8px_14px] bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white font-medium text-sm leading-[1.4] border-none rounded-s cursor-default transition-all duration-300 shadow-[0_2px_5px_rgba(0,0,0,0.3)] z-100 opacity-70 pointer-events-none font-sans inline-flex items-center justify-center whitespace-nowrap max-[850px]:bottom-2.5 max-[850px]:right-2.5 max-[850px]:p-[6px_10px] max-[850px]:text-xs group-[.active-clip]:opacity-100 group-[.active-clip]:pointer-events-auto group-[.active-clip]:cursor-pointer hover:scale-105 active:scale-95"
              >
                Delete
              </button>
            </div>

            <div class="mt-3 bg-white rounded-[25px] p-[10px_20px] text-center max-w-full shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex-shrink-0">
              <p class="text-[clamp(0.9rem,1.8vw,1.2rem)] font-bold text-dark m-0 overflow-hidden text-ellipsis [-webkit-line-clamp:2] [-webkit-box-orient:vertical] [display:-webkit-box] font-sans max-[850px]:text-[0.9rem]">{{ clip.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


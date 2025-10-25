<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiService } from '@/services/api'
import type { SearchResult } from '@/types'
import UserButtons from '@/components/UserButtons.vue'
import ClipInspector from '@/components/ClipInspector.vue'

const route = useRoute()
const router = useRouter()

const query = ref('')
const searchQuery = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')
const loadedClips = ref(0)
const videoCache = ref<{ [key: number]: string }>({})
const videoErrors = ref<{ [key: number]: boolean }>({})
const loadingClips = ref(false)
const activeIndex = ref(0)
const videoReel = ref<HTMLElement | null>(null)
const isManualScroll = ref(false)
const inspectorVisible = ref(false)
const inspectorClipIndex = ref(0)
const inspectorClipUrl = ref('')

const displayedResults = computed(() => {
  return results.value.slice(0, loadedClips.value).filter((_, index) =>
    videoCache.value[index] || videoErrors.value[index]
  )
})

onMounted(async () => {
  query.value = (route.query.query as string) || ''
  searchQuery.value = query.value
  await loadSearchResults()

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (activeIndex.value > 0) {
        scrollToClip(activeIndex.value - 1)
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      if (activeIndex.value < results.value.length - 1) {
        scrollToClip(activeIndex.value + 1)
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown)

  setTimeout(() => {
    if (videoReel.value) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (isManualScroll.value) return

          let mostVisible: { entry: IntersectionObserverEntry; ratio: number } | null = null

          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!mostVisible || entry.intersectionRatio > mostVisible.ratio) {
                mostVisible = { entry, ratio: entry.intersectionRatio }
              }
            }
          })

          if (mostVisible && mostVisible.ratio > 0.5) {
            const index = parseInt((mostVisible.entry.target as HTMLElement).dataset.idx || '0')
            if (activeIndex.value !== index) {
              activeIndex.value = index
            }
          }
        },
        {
          threshold: [0, 0.25, 0.5, 0.75, 1],
          root: videoReel.value
        }
      )

      const items = videoReel.value.querySelectorAll('.reel-item')
      items.forEach((item) => observer.observe(item))
    }
  }, 100)
})

const loadSearchResults = async () => {
  if (!query.value) return

  loading.value = true
  error.value = ''

  try {
    results.value = await apiService.searchClips(query.value)
    if (results.value.length > 0) {
      await loadNextClips()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load search results'
  } finally {
    loading.value = false
  }
}

const loadNextClips = async (batchSize = 3) => {
  if (loadingClips.value) return

  loadingClips.value = true
  const startIdx = loadedClips.value
  const endIdx = Math.min(startIdx + batchSize, results.value.length)

  for (let i = startIdx; i < endIdx; i++) {
    try {
      const blob = await apiService.getVideo((i + 1).toString())
      const url = URL.createObjectURL(blob)
      videoCache.value[i] = url
      videoErrors.value[i] = false
    } catch (err) {
      console.error(`Failed to load clip ${i}:`, err)
      videoErrors.value[i] = true
    }
  }

  loadedClips.value = endIdx
  loadingClips.value = false
}

const handleSearch = () => {
  const trimmedQuery = searchQuery.value.trim()
  if (!trimmedQuery) return

  router.push({
    name: 'search-results',
    query: { query: trimmedQuery },
  })

  query.value = trimmedQuery
  results.value = []
  loadedClips.value = 0
  videoCache.value = {}
  videoErrors.value = {}
  loadSearchResults()
}

const handleAdjust = (index: number) => {
  if (videoCache.value[index]) {
    inspectorClipIndex.value = index
    inspectorClipUrl.value = videoCache.value[index]
    inspectorVisible.value = true
  }
}

const closeInspector = () => {
  inspectorVisible.value = false
}

const handleDownload = async (index: number) => {
  try {
    if (videoCache.value[index]) {
      const a = document.createElement('a')
      a.href = videoCache.value[index]
      a.download = `ranchbot_clip_${index + 1}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      const blob = await apiService.getVideo((index + 1).toString())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ranchbot_clip_${index + 1}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  } catch (err: any) {
    console.error('Download failed:', err)
    alert('Download failed: ' + err.message)
  }
}

const handleLoadMore = () => {
  loadNextClips()
}

const scrollToClip = (index: number) => {
  if (!videoReel.value) return

  isManualScroll.value = true

  const items = videoReel.value.querySelectorAll('.reel-item')
  const targetItem = items[index] as HTMLElement

  if (targetItem) {
    const containerRect = videoReel.value.getBoundingClientRect()
    const itemRect = targetItem.getBoundingClientRect()
    const scrollLeft = videoReel.value.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) / 2

    videoReel.value.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })

    activeIndex.value = index

    setTimeout(() => {
      isManualScroll.value = false
    }, 1000)
  }
}

const handleClipClick = (index: number, event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (target.closest('.adjust-btn') || target.closest('.download-btn') || target.closest('button')) {
    return
  }

  scrollToClip(index)
}

const onVideoLoaded = (event: Event, index: number) => {
  const video = event.target as HTMLVideoElement
  if (index === activeIndex.value) {
    video.play().catch(() => {})
  }
}

watch(activeIndex, async (newIndex, oldIndex) => {
  if (!videoReel.value) return

  const items = videoReel.value.querySelectorAll('.reel-item video') as NodeListOf<HTMLVideoElement>

  items.forEach((video, index) => {
    if (index !== newIndex && !video.paused) {
      video.pause()
      video.currentTime = 0
    }
  })

  if (items[newIndex]) {
    try {
      if (items[newIndex].readyState >= 2) {
        await items[newIndex].play()
      }
    } catch (err) {
      // Autoplay prevented - silent fail
    }
  }
})
</script>

<template>
  <UserButtons fixed />
  <main class="relative w-screen h-screen overflow-hidden m-0 p-0">
    <div class="fixed top-7.5 left-7.5 right-0 pr-7.5 z-100 flex flex-row items-center justify-between max-[850px]:flex-col max-[850px]:p-[10px_15px] max-[850px]:gap-2.5 max-[850px]:top-[5px]">
      <div class="flex flex-row items-center no-underline flex-shrink-0 gap-[15px]">
        <router-link to="/" class="flex items-center">
          <img src="/images/branding/logo.svg" class="w-[100px] h-[100px] cursor-pointer block drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] max-[850px]:w-[50px] max-[850px]:h-[50px]" alt="RanchBot Logo" />
        </router-link>
        <h1 class="text-5xl font-bold text-white m-0 whitespace-nowrap [text-shadow:0_2px_8px_rgba(0,0,0,0.5)] max-[850px]:text-2xl">RanchBot</h1>
      </div>

      <div class="absolute left-1/2 -translate-x-1/2 w-500px max-w-500px flex flex-col items-center max-[850px]:relative max-[850px]:left-0 max-[850px]:translate-x-0 max-[850px]:w-full max-[850px]:max-w-full">
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            id="query-input"
            type="text"
            placeholder="Enter a quote"
            class="w-full border-none bg-white rounded-xl p-[clamp(16px,2vw,24px)_clamp(20px,3vw,32px)] pr-[clamp(60px,6vw,70px)] text-[clamp(1.4rem,3vw,2rem)] shadow-[0_10px_24px_rgba(0,0,0,0.3)] text-dark font-extrabold font-sans"
            @keypress.enter="handleSearch"
          />
          <button class="absolute top-1/2 -translate-y-1/2 right-[15px] h-[42px] w-[42px] flex items-center justify-center bg-transparent border-none cursor-pointer p-0 pointer-events-auto transition-transform duration-200 active:scale-95" @click="handleSearch" aria-label="Search">
            <img src="/images/ui/icons/arrow-circle-right.svg" alt="Search" class="pointer-events-none transition-transform duration-200 hover:scale-115 w-[clamp(30px,4vw,42px)] h-auto drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]" />
          </button>
        </div>
        <button type="button" class="absolute bottom-[-50px] right-2 z-20 font-bold bg-btn-bg text-white border-none cursor-pointer transition-all duration-200 hover:bg-btn-bg-hover rotate-[5deg] hover:rotate-[5deg] hover:scale-108 active:rotate-[5deg] active:scale-95 rounded-l p-[clamp(10px,1.5vw,14px)_clamp(16px,2vw,24px)] text-[clamp(1rem,2.5vw,1.6rem)] shadow-[0_6px_15px_rgba(0,0,0,0.2)]">Filters</button>
      </div>
    </div>

    <div v-if="loading" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-5 flex flex-col items-center gap-7.5">
      <div class="w-[120px] h-[120px] border-[12px] border-[rgba(200,200,200,0.3)] border-t-accent rounded-full animate-spin"></div>
      <p class="text-[2rem] font-bold text-dark">Loading results...</p>
    </div>

    <div v-else-if="error" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xl z-5 text-red-600">{{ error }}</div>

    <div v-else-if="results.length === 0 && !loading" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xl z-5">
      No results found for "{{ query }}"
    </div>

    <div v-else class="scroll-smooth snap-x snap-mandatory overflow-x-scroll overflow-y-hidden flex items-center h-screen w-screen fixed top-0 left-0 m-0 p-0 pt-[120px] max-[850px]:flex-col max-[850px]:overflow-y-scroll max-[850px]:overflow-x-hidden max-[850px]:snap-y max-[850px]:pt-[180px]" ref="videoReel">
      <div
        v-for="(result, index) in displayedResults"
        :key="index"
        class="reel-item snap-center transition-all duration-300 flex-shrink-0 opacity-50 scale-85 w-auto h-70vh min-w-auto max-w-none mx-5 p-0 relative flex items-center justify-center cursor-pointer overflow-hidden rounded-xl z-1 max-[850px]:w-[90vw] max-[850px]:h-auto max-[850px]:max-w-[90vw] max-[850px]:my-2.5 max-[850px]:mx-0"
        :class="{ 'z-50 opacity-100 scale-100 shadow-glow-orange': index === activeIndex }"
        :data-idx="index"
        @click="handleClipClick(index, $event)"
      >
        <video
          v-if="videoCache[index]"
          loop
          muted
          playsinline
          preload="auto"
          :src="videoCache[index]"
          @loadeddata="onVideoLoaded($event, index)"
          class="w-auto h-full max-h-70vh object-contain rounded-xl block cursor-pointer aspect-auto max-[850px]:w-full max-[850px]:h-auto max-[850px]:max-h-none"
          :class="{ 'border-[3px] border-accent': index === activeIndex }"
        ></video>
        <div v-else-if="videoErrors[index]" class="flex flex-col items-center justify-center min-h-[300px] bg-red-100 text-red-700 p-4 rounded-xl text-center">
          <svg class="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="font-semibold text-lg">Failed to load clip</p>
          <p class="text-sm mt-1">Clip #{{ index + 1 }} is unavailable</p>
        </div>

        <button v-if="videoCache[index]" class="absolute top-[25px] left-[25px] px-[14px] py-2 border-none rounded-lg text-sm font-medium leading-[1.4] cursor-default z-100 transition-all duration-300 pointer-events-none opacity-70 box-border h-auto min-h-auto inline-flex items-center justify-center whitespace-nowrap bg-gradient-action text-white hover:opacity-100 hover:scale-105 active:scale-95 shadow-[0_2px_5px_rgba(0,0,0,0.3)] max-[850px]:px-2.5 max-[850px]:py-[6px] max-[850px]:text-xs max-[850px]:top-2.5 max-[850px]:left-2.5" :class="{ '!opacity-100 pointer-events-auto cursor-pointer': index === activeIndex }" @click.stop="handleAdjust(index)">Adjust</button>
        <button v-if="videoCache[index]" class="absolute top-[25px] right-[25px] px-[14px] py-2 border-none rounded-lg text-sm font-medium leading-[1.4] cursor-default z-100 transition-all duration-300 pointer-events-none opacity-70 box-border h-auto min-h-auto inline-flex items-center justify-center whitespace-nowrap bg-[rgba(170,170,170,0.9)] text-white hover:opacity-100 hover:scale-105 active:scale-95 shadow-[0_2px_5px_rgba(0,0,0,0.3)] max-[850px]:px-2.5 max-[850px]:py-[6px] max-[850px]:text-xs max-[850px]:top-2.5 max-[850px]:right-2.5" :class="{ '!opacity-100 pointer-events-auto cursor-pointer': index === activeIndex }" @click.stop="handleDownload(index)">Download</button>
      </div>

      <div
        v-if="loadingClips || loadedClips < results.length"
        class="reel-item snap-center flex-shrink-0 opacity-50 w-auto h-70vh min-w-auto max-w-none mx-5 p-0 flex items-center justify-center rounded-xl z-1 max-[850px]:w-[90vw] max-[850px]:h-auto max-[850px]:max-w-[90vw] max-[850px]:my-2.5 max-[850px]:mx-0"
      >
        <div v-if="loadingClips" class="flex flex-col items-center justify-center min-h-[300px] bg-gray-200 rounded-xl w-full">
          <div class="w-[50px] h-[50px] border-[5px] border-[rgba(200,200,200,0.3)] border-t-accent rounded-full animate-spin mb-3"></div>
          <p class="text-gray-600 font-semibold">Loading more clips...</p>
        </div>
        <button
          v-else
          class="px-8 py-4 bg-gradient-action text-white border-none rounded-xl cursor-pointer font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong"
          @click="handleLoadMore"
        >
          Load More
        </button>
      </div>
    </div>
  </main>

  <ClipInspector
    :clip-index="inspectorClipIndex"
    :clip-url="inspectorClipUrl"
    :visible="inspectorVisible"
    @close="closeInspector"
  />
</template>

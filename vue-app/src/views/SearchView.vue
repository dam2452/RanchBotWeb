<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UserButtons from '@/components/UserButtons.vue'

const router = useRouter()
const query = ref('')

const handleSearch = () => {
  const trimmedQuery = query.value.trim()
  if (!trimmedQuery) return

  router.push({
    name: 'search-results',
    query: { query: trimmedQuery },
  })
}
</script>

<template>
  <UserButtons fixed />
  <main class="flex flex-col items-center justify-center p-0 text-center min-h-screen h-screen transition-all duration-400 w-full fixed top-0 left-0 right-0 bottom-0 box-border m-auto gap-[60px] max-[850px]:translate-x-0 max-[480px]:pt-10">
    <div class="relative z-10 flex flex-col items-center justify-center text-center transition-transform duration-400">
      <router-link to="/" class="active:scale-95">
        <img src="/images/branding/logo.svg" class="mb-15 transition-transform duration-300 w-[clamp(243px,29.7vw,351px)] max-[850px]:!w-[clamp(160px,35vw,220px)] max-[480px]:!w-[clamp(140px,40vw,180px)]" alt="RanchBot Logo" />
      </router-link>
      <h1 class="mb-5 transition-all duration-400 text-center text-[clamp(3.375rem,6.75vw,5.4rem)] max-[850px]:!text-[clamp(2.2rem,7vw,3rem)]">RanchBot</h1>
    </div>

    <form id="searchForm" class="relative z-10 flex flex-col items-center transition-all duration-400 w-[clamp(280px,60vw,720px)] max-w-[90vw] max-[850px]:!w-[85vw] max-[850px]:!max-w-500px max-[480px]:!w-[85vw] max-[480px]:!mx-auto" autocomplete="off" @submit.prevent="handleSearch">
      <div class="relative w-full">
        <input
          v-model="query"
          type="text"
          id="quoteInput"
          name="query"
          placeholder="Enter a quote"
          class="w-full border-none bg-white rounded-xl transition-all duration-400 p-[clamp(16px,2vw,24px)_clamp(20px,3vw,32px)] pr-[clamp(60px,6vw,70px)] text-[clamp(1.4rem,3vw,2rem)] shadow-[0_10px_24px_rgba(0,0,0,0.3)] text-dark font-extrabold font-sans max-[850px]:!pr-[60px]"
          required
          autocomplete="off"
          autofill="off"
        />
        <button type="submit" class="absolute top-1/2 -translate-y-1/2 right-[15px] h-[42px] w-[42px] flex items-center justify-center bg-transparent border-none cursor-pointer p-0 pointer-events-auto transition-transform duration-200 active:scale-95" aria-label="Search">
          <img src="/images/ui/icons/arrow-circle-right.svg" alt="Search" class="pointer-events-none transition-transform duration-200 hover:scale-115 w-[clamp(30px,4vw,42px)] h-auto drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]" />
        </button>
      </div>
      <button type="button" class="absolute bottom-[-50px] right-2 z-20 font-bold bg-btn-bg text-white border-none cursor-pointer transition-all duration-200 hover:bg-btn-bg-hover rotate-[5deg] hover:rotate-[5deg] hover:scale-108 active:rotate-[5deg] active:scale-95 rounded-l p-[clamp(10px,1.5vw,14px)_clamp(16px,2vw,24px)] text-[clamp(1rem,2.5vw,1.6rem)] shadow-[0_6px_15px_rgba(0,0,0,0.2)] max-[850px]:!bottom-[-40px] max-[850px]:!translate-y-[-5px] max-[480px]:!bottom-[-35px] max-[480px]:!p-[8px_16px] max-[480px]:!text-base">Filters</button>
    </form>

    <div id="resultsContainer" class="results-container"></div>
  </main>
</template>

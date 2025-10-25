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
  <main class="flex flex-col items-center justify-center p-0 text-center min-h-screen h-screen transition-all duration-400 w-full fixed top-0 left-0 right-0 bottom-0 box-border m-auto" style="gap: 60px;">
    <div class="relative z-10 flex flex-col items-center justify-center text-center transition-transform duration-400">
      <router-link to="/" class="active:scale-95">
        <img src="/images/branding/logo.svg" class="mb-15 transition-transform duration-300" style="width: clamp(243px, 29.7vw, 351px);" alt="RanchBot Logo" />
      </router-link>
      <h1 class="mb-5 transition-all duration-400 text-center" style="font-size: clamp(3.375rem, 6.75vw, 5.4rem);">RanchBot</h1>
    </div>

    <form id="searchForm" class="relative z-10 flex flex-col items-center transition-all duration-400" style="width: clamp(280px, 60vw, 720px); max-width: 90vw;" autocomplete="off" @submit.prevent="handleSearch">
      <div class="relative w-full">
        <input
          v-model="query"
          type="text"
          id="quoteInput"
          name="query"
          placeholder="Enter a quote"
          class="w-full border-none bg-white rounded-[40px] transition-all duration-400"
          style="padding: clamp(16px, 2vw, 24px) clamp(20px, 3vw, 32px); padding-right: clamp(60px, 6vw, 70px); font-size: clamp(1.4rem, 3vw, 2rem); box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3); color: #333; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;"
          required
          autocomplete="off"
          autofill="off"
        />
        <button type="submit" class="absolute top-1/2 -translate-y-1/2 h-[42px] w-[42px] flex items-center justify-center bg-transparent border-none cursor-pointer p-0 pointer-events-auto transition-transform duration-200 active:scale-95" style="right: 15px;" aria-label="Search">
          <img src="/images/ui/icons/arrow-circle-right.svg" alt="Search" class="pointer-events-none transition-transform duration-200 hover:scale-115" style="width: clamp(30px, 4vw, 42px); height: auto; filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));" />
        </button>
      </div>
      <button type="button" class="font-bold bg-[#888] text-white border-none cursor-pointer transition-all duration-200 hover:bg-[#666] rotate-[5deg] hover:rotate-[5deg] hover:scale-108 active:rotate-[5deg] active:scale-95 rounded-[20px]" style="position: absolute; bottom: -50px; right: 8px; padding: clamp(10px, 1.5vw, 14px) clamp(16px, 2vw, 24px); font-size: clamp(1rem, 2.5vw, 1.6rem); box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2); z-index: 20;">Filters</button>
    </form>

    <div id="resultsContainer" class="results-container"></div>
  </main>
</template>

<style scoped>
@media screen and (max-width: 850px) {
  main {
    transform: translateX(0);
  }

  .logo-img {
    width: clamp(160px, 35vw, 220px) !important;
  }

  h1 {
    font-size: clamp(2.2rem, 7vw, 3rem) !important;
  }

  form {
    width: 85vw !important;
    max-width: 500px !important;
  }

  input {
    width: 100% !important;
    padding-right: 60px !important;
  }

  .filter-btn {
    bottom: -40px !important;
    transform: rotate(5deg) translateY(-5px) !important;
  }
}

@media screen and (max-width: 480px) {
  form {
    width: 85vw !important;
    margin: 0 auto !important;
  }

  .logo-img {
    width: clamp(140px, 40vw, 180px) !important;
  }

  main {
    padding-top: 40px !important;
  }

  .filter-btn {
    bottom: -35px !important;
    padding: 8px 16px !important;
    font-size: 1rem !important;
  }
}
</style>

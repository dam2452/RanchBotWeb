<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

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
  <AppHeader />
  <main class="search-page">
    <div class="logo-wrapper">
      <router-link to="/">
        <img src="/images/branding/logo.svg" class="logo-img" alt="RanchBot Logo" />
      </router-link>
      <h1 class="title">RanchBot</h1>
    </div>

    <form id="searchForm" class="search-container" autocomplete="off" @submit.prevent="handleSearch">
      <input
        v-model="query"
        type="text"
        id="quoteInput"
        name="query"
        placeholder="Enter a quote"
        class="search-input"
        required
        autocomplete="off"
        autofill="off"
      />
      <button type="submit" class="search-icon-btn" aria-label="Search">
        <img src="/images/ui/icons/arrow-circle-right.svg" alt="Search" />
      </button>
      <button type="button" class="filter-btn">Filters</button>
    </form>

    <div id="resultsContainer" class="results-container"></div>
  </main>
</template>

<style scoped>
@import '@/assets/styles/css/pages/search.css';
</style>

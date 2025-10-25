<script setup lang="ts">
import { useRouter } from 'vue-router'
import UserButtons from '@/components/UserButtons.vue'
import LogoSection from '@/components/LogoSection.vue'
import SearchBar from '@/components/SearchBar.vue'

const router = useRouter()

const handleSearch = (query: string) => {
  router.push({
    name: 'search-results',
    query: { query },
  })
}

const handleFilters = () => {
  // TODO: Implement filters functionality
  console.log('Filters clicked')
}
</script>

<template>
  <UserButtons fixed />

  <main class="search-page">
    <LogoSection />
    <SearchBar @search="handleSearch" @filters="handleFilters" />
  </main>
</template>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3.75rem;
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  margin: auto;
  padding: 0;
  text-align: center;
  transition: all 0.4s;
}

@media (max-width: 850px) {
  .search-page {
    transform: translateX(0);
  }
}

@media (max-width: 480px) {
  .search-page {
    padding-top: 2.5rem;
  }
}
</style>

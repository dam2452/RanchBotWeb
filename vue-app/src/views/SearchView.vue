<script setup lang="ts">
import { useRouter } from 'vue-router'
import UserButtons from '@/components/UserButtons.vue'
import LogoSection from '@/components/LogoSection.vue'
import SearchBar from '@/components/SearchBar.vue'
import AppFooter from '@/components/AppFooter.vue'

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
  <AppFooter />

  <main class="search-page">
    <div class="content-wrapper">
      <LogoSection />
      <SearchBar @search="handleSearch" @filters="handleFilters" />
    </div>
  </main>
</template>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.content-wrapper {
  transform: translateY(-12vh);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3.75rem;
  width: clamp(280px, 60vw, 720px);
  max-width: 90vw;
}

.search-page :deep(.logo-section) {
  max-width: 100%;
  flex: none;
}

.search-page :deep(.logo) {
  width: clamp(224px, 24vw, 352px) !important;
}

.search-page :deep(.title) {
  font-size: clamp(4.48rem, 8vw, 8.8rem) !important;
  margin: 1rem 0 !important;
}

@media (max-width: 850px) {
  .search-page :deep(.logo) {
    width: clamp(230px, 23vw, 345px) !important;
  }

  .search-page :deep(.title) {
    font-size: clamp(4rem, 6.9vw, 8rem) !important;
  }
}

@media (max-width: 850px) {
  .search-page {
    transform: translateX(0);
    justify-content: flex-start;
    padding-top: 15vh !important;
  }

  .content-wrapper {
    transform: none;
    width: 85vw;
    max-width: 500px;
  }
}

@media (max-width: 480px) {
  .search-page {
    padding-top: 12vh !important;
  }

  .content-wrapper {
    transform: none;
    width: 85vw;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import UserButtons from '@/components/UserButtons.vue'
import LogoSection from '@/components/LogoSection.vue'
import SearchBar from '@/components/SearchBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const windowWidth = ref(window.innerWidth)

const isWatchView = computed(() => windowWidth.value <= 196)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const handleSearch = (query: string) => {
  router.push({
    name: 'search-results',
    query: { query },
  })
}

const handleFilters = () => {
  console.log('Filters clicked')
}
</script>

<template>
  <UserButtons v-if="!isWatchView" fixed />
  <AppFooter v-if="!isWatchView" />

  <main class="search-page">
    <div v-if="isWatchView" class="watch-content">
      <SearchBar @search="handleSearch" @filters="handleFilters" />
    </div>

    <div v-else class="content-wrapper">
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
  justify-content: flex-start;
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
  padding: 18vh 0 0;
  text-align: center;
  transition: all var(--transition-default);
}

.watch-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 180px;
  padding: var(--spacing-sm);
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  width: 85vw;
  max-width: 500px;
}

.content-wrapper :deep(.logo-section) {
  max-width: 100%;
  flex: none;
  transform: scale(1.5);
  margin-bottom: 0.5rem;
}

.content-wrapper :deep(.title) {
  font-size: clamp(2.5rem, 5vw, 4.5rem) !important;
  margin: 0 0 3rem 0 !important;
}

@media (min-width: 481px) {
  .search-page {
    padding-top: 15vh;
  }

  .content-wrapper {
    width: clamp(400px, 70vw, 550px);
  }

  .content-wrapper :deep(.logo-section) {
    transform: scale(1.2);
    margin-bottom: 1rem;
  }

  .content-wrapper :deep(.title) {
    font-size: clamp(4rem, 6.5vw, 7.5rem) !important;
    margin: 0 0 2.5rem 0 !important;
  }
}

@media (min-width: 851px) {
  .search-page {
    justify-content: center;
    padding: 0;
  }

  .content-wrapper {
    transform: translateY(-5vh);
    width: clamp(500px, 60vw, 720px);
    max-width: 90vw;
  }

  .content-wrapper :deep(.logo-section) {
    transform: scale(0.75);
    margin-bottom: 0.5rem;
  }

  .content-wrapper :deep(.title) {
    font-size: clamp(4rem, 6vw, 6.5rem) !important;
    margin: 0 0 2rem 0 !important;
  }
}

@media (min-width: 1200px) {
  .content-wrapper {
    transform: translateY(-8vh);
  }

  .content-wrapper :deep(.logo-section) {
    transform: scale(0.85);
    margin-bottom: 1rem;
  }

  .content-wrapper :deep(.title) {
    font-size: clamp(5rem, 7vw, 7.5rem) !important;
    margin: 0 0 2.5rem 0 !important;
  }
}

@media (min-width: 1800px) {
  .content-wrapper {
    transform: translateY(-10vh);
  }

  .content-wrapper :deep(.logo-section) {
    transform: scale(0.9);
    margin-bottom: 1.5rem;
  }

  .content-wrapper :deep(.title) {
    font-size: clamp(5rem, 8vw, 8.8rem) !important;
    margin: 0 0 3rem 0 !important;
  }
}
</style>

<script setup lang="ts">
import SearchInput from './SearchInput.vue'
import FiltersButton from './FiltersButton.vue'

interface Emits {
  (e: 'search', query: string): void
  (e: 'filters'): void
}

const emit = defineEmits<Emits>()

const handleSearch = (query: string) => {
  emit('search', query)
}

const handleFilters = () => {
  emit('filters')
}
</script>

<template>
  <div class="search-container">
    <SearchInput @search="handleSearch" />
    <FiltersButton @click="handleFilters" />
  </div>
</template>

<style scoped>
.search-container {
  position: relative;
  width: clamp(280px, 60vw, 720px);
  max-width: 90vw;
  margin: 0 auto;
  z-index: 100;
  transition: all 0.4s ease;
}

@media (max-width: 850px) {
  .search-container {
    width: 85vw;
    max-width: 500px;
  }
}

@media (max-width: 480px) {
  .search-container {
    width: 85vw;
  }
}
</style>

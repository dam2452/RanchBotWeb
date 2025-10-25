<script setup lang="ts">
import SearchInput from './SearchInput.vue'
import FiltersButton from './FiltersButton.vue'

interface Props {
  initialQuery?: string
}

interface Emits {
  (e: 'search', query: string): void
  (e: 'filters'): void
}

const props = withDefaults(defineProps<Props>(), {
  initialQuery: ''
})

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
    <SearchInput :initial-query="initialQuery" @search="handleSearch" />
    <FiltersButton @click="handleFilters" />
  </div>
</template>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
  z-index: 100;
  transition: all 0.4s ease;
}
</style>

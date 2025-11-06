<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
const windowWidth = ref(window.innerWidth)

const showFilters = computed(() => windowWidth.value > 196)

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
  emit('search', query)
}

const handleFilters = () => {
  emit('filters')
}
</script>

<template>
  <div class="search-container">
    <SearchInput :initial-query="initialQuery" @search="handleSearch" />
    <FiltersButton v-if="showFilters" @click="handleFilters" />
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

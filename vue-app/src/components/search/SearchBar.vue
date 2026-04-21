<script setup lang="ts">
import { computed } from 'vue'
import SearchInput from './SearchInput.vue'
import FiltersButton from './FiltersButton.vue'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { WATCH_BREAKPOINT } from '@/utils/formatters'

interface Props {
  initialQuery?: string
}

interface Emits {
  (e: 'search', query: string): void
  (e: 'filters'): void
}

withDefaults(defineProps<Props>(), {
  initialQuery: ''
})

const emit = defineEmits<Emits>()
const { windowWidth } = useWindowWidth()

const showFilters = computed(() => windowWidth.value > WATCH_BREAKPOINT)

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

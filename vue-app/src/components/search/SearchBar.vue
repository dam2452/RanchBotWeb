<script setup lang="ts">
import { computed } from 'vue'
import SearchInput from './SearchInput.vue'
import FiltersButton from './FiltersButton.vue'
import FilterChips from './FilterChips.vue'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { WATCH_BREAKPOINT } from '@/utils/formatters'
import type { ActiveFilters } from '@/types'

interface Props {
  initialQuery?: string
  activeFilterCount?: number
  appliedFilters?: ActiveFilters
  allowEmptySearch?: boolean
  semanticMode?: boolean
}

interface Emits {
  (e: 'search', query: string): void
  (e: 'filters'): void
  (e: 'remove-filter', category: keyof ActiveFilters, value: string): void
  (e: 'toggle-semantic'): void
}

const props = withDefaults(defineProps<Props>(), {
  initialQuery: '',
  activeFilterCount: 0,
  appliedFilters: undefined,
  allowEmptySearch: false,
  semanticMode: false
})

const emit = defineEmits<Emits>()
const { windowWidth } = useWindowWidth()

const showFilters = computed(() => windowWidth.value > WATCH_BREAKPOINT && !props.semanticMode)
const showChips = computed(() => !props.semanticMode && props.appliedFilters && props.activeFilterCount > 0)

const handleSearch = (query: string) => {
  emit('search', query)
}

const handleFilters = () => {
  emit('filters')
}

const handleRemoveFilter = (category: keyof ActiveFilters, value: string) => {
  emit('remove-filter', category, value)
}

const handleToggleSemantic = () => {
  emit('toggle-semantic')
}
</script>

<template>
  <div class="search-container">
    <SearchInput
      :initial-query="initialQuery"
      :allow-empty-search="allowEmptySearch"
      :semantic-mode="semanticMode"
      @search="handleSearch"
      @toggle-semantic="handleToggleSemantic"
    />
    <FiltersButton v-if="showFilters" :active-count="activeFilterCount" @click="handleFilters" />
    <FilterChips v-if="showChips && appliedFilters" :filters="appliedFilters" @remove="handleRemoveFilter" />
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

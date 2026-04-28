<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import UserButtons from '@/components/layout/UserButtons.vue'
import LogoSection from '@/components/layout/LogoSection.vue'
import SearchBar from '@/components/search/SearchBar.vue'
import FilterModal from '@/components/search/FilterModal.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { useFilters } from '@/composables/useFilters'
import { WATCH_BREAKPOINT } from '@/utils/formatters'
import type { ActiveFilters } from '@/types'

const router = useRouter()
const { windowWidth } = useWindowWidth()
const isWatchView = computed(() => windowWidth.value <= WATCH_BREAKPOINT)

const showFilterModal = ref(false)

const {
  characters, objects, emotions, seasons, episodes,
  selectedFilters, appliedFilters,
  hasActiveFilters, activeFilterCount,
  optionsLoading, applyLoading,
  loadFilterOptions, loadEpisodes,
  applyFilters, resetFilters, fetchFilterInfo,
  toggleFilter, removeAppliedFilter
} = useFilters()

const handleSearch = (query: string) => {
  router.push({
    name: 'search-results',
    query: { query },
  })
}

const handleFilters = () => {
  showFilterModal.value = true
  loadFilterOptions()
  fetchFilterInfo()
}

const handleFilterToggle = (category: keyof ActiveFilters, value: string): void => {
  toggleFilter(category, value)
}

const handleFilterApply = async (): Promise<void> => {
  await applyFilters()
  showFilterModal.value = false
  router.push({ name: 'search-results', query: {} })
}

const handleFilterReset = async (): Promise<void> => {
  await resetFilters()
  showFilterModal.value = false
}

const handleFilterRemove = async (category: keyof ActiveFilters, value: string): Promise<void> => {
  await removeAppliedFilter(category, value)
}
</script>

<template>
  <UserButtons v-if="!isWatchView" fixed compact />
  <AppFooter v-if="!isWatchView" />

  <main class="search-page">
    <div v-if="isWatchView" class="watch-content">
      <SearchBar
        :active-filter-count="activeFilterCount"
        :applied-filters="appliedFilters"
        :allow-empty-search="hasActiveFilters"
        @search="handleSearch"
        @filters="handleFilters"
        @remove-filter="handleFilterRemove"
      />
    </div>

    <div v-else class="content-wrapper">
      <LogoSection />
      <SearchBar
        :active-filter-count="activeFilterCount"
        :applied-filters="appliedFilters"
        :allow-empty-search="hasActiveFilters"
        @search="handleSearch"
        @filters="handleFilters"
        @remove-filter="handleFilterRemove"
      />
    </div>

    <FilterModal
      :show="showFilterModal"
      :selected-filters="selectedFilters"
      :seasons="seasons"
      :episodes="episodes"
      :characters="characters"
      :objects="objects"
      :emotions="emotions"
      :loading="optionsLoading"
      :apply-loading="applyLoading"
      @close="showFilterModal = false"
      @applied="handleFilterApply"
      @toggle="handleFilterToggle"
      @remove="handleFilterToggle"
      @apply="handleFilterApply"
      @reset="handleFilterReset"
    />
  </main>
</template>

<style scoped lang="scss">
.search-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
  margin: auto;
  padding: 18vh 0 0;
  text-align: center;
  transition: all var(--transition-default);

  @include mobile {
    padding-top: 15vh;
  }

  @include tablet {
    justify-content: center;
    padding: 0;
  }
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

  @include mobile {
    width: clamp(400px, 70vw, 550px);
  }

  @include tablet {
    transform: translateY(-5vh);
    width: clamp(500px, 60vw, 720px);
    max-width: 90vw;
  }

  @include desktop-up {
    transform: translateY(-8vh);
  }

  @include large {
    transform: translateY(-10vh);
  }
}

.content-wrapper :deep(.logo-section) {
  max-width: 100%;
  flex: none;
  transform: scale(1.5);
  margin-bottom: 0.5rem;

  @include mobile {
    transform: scale(1.2);
    margin-bottom: 1rem;
  }

  @include tablet {
    transform: scale(0.75);
    margin-bottom: 0.5rem;
  }

  @include desktop-up {
    transform: scale(0.85);
    margin-bottom: 1rem;
  }

  @include large {
    transform: scale(0.9);
    margin-bottom: 1.5rem;
  }
}

.content-wrapper :deep(.title) {
  font-size: clamp(2.5rem, 5vw, 4.5rem) !important;
  margin: 0 0 3rem 0 !important;

  @include mobile {
    font-size: clamp(4rem, 6.5vw, 7.5rem) !important;
    margin: 0 0 2.5rem 0 !important;
  }

  @include tablet {
    font-size: clamp(4rem, 6vw, 6.5rem) !important;
    margin: 0 0 2rem 0 !important;
  }

  @include desktop-up {
    font-size: clamp(5rem, 7vw, 7.5rem) !important;
    margin: 0 0 2.5rem 0 !important;
  }

  @include large {
    font-size: clamp(5rem, 8vw, 8.8rem) !important;
    margin: 0 0 3rem 0 !important;
  }
}
</style>

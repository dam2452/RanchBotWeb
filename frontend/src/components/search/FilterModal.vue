<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ActiveFilters } from '@/types'
import SeasonTab from './SeasonTab.vue'
import ChipTab from './ChipTab.vue'
import SearchableTab from './SearchableTab.vue'

interface Props {
  show: boolean
  selectedFilters: ActiveFilters
  seasons: Record<string, number>
  episodes: { number: number; title?: string }[]
  characters: { name: string }[]
  objects: { name: string }[]
  emotions: { name: string; label?: string }[]
  loading: boolean
  applyLoading: boolean
  availableSeries?: string[]
  currentSeries?: string[]
  seriesLoading?: boolean
  isSingleSeries?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'applied'): void
  (e: 'toggle', category: keyof ActiveFilters, value: string): void
  (e: 'remove', category: keyof ActiveFilters, value: string): void
  (e: 'apply'): void
  (e: 'reset'): void
  (e: 'select-series', series: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  availableSeries: () => [],
  currentSeries: () => [],
  seriesLoading: false,
  isSingleSeries: false,
})
const emit = defineEmits<Emits>()

type TabKey = keyof ActiveFilters | 'serial'

const activeTab = ref<TabKey>('serial')

const tabs = computed<{ key: TabKey; label: string }[]>(() => {
  const serialTab = props.availableSeries.length > 1
    ? [{ key: 'serial' as const, label: 'Serial' }]
    : []
  const filterTabs = props.isSingleSeries
    ? [
        { key: 'season' as TabKey, label: 'Sezon' },
        { key: 'episode' as TabKey, label: 'Odcinek' },
        { key: 'character' as TabKey, label: 'Postacie' },
        { key: 'emotion' as TabKey, label: 'Emocje' },
        { key: 'object' as TabKey, label: 'Obiekty' },
      ]
    : []
  return [...serialTab, ...filterTabs]
})

const _formatSeriesName = (name: string): string =>
  name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') emit('close')
}

const isSelected = (category: keyof ActiveFilters, value: string): boolean => {
  return props.selectedFilters[category].includes(value)
}

const isSeriesSelected = (name: string): boolean => {
  return props.currentSeries.includes(name)
}

const toggleSeries = (name: string): void => {
  if (props.seriesLoading) return
  const current = [...props.currentSeries]
  if (isSeriesSelected(name)) {
    const updated = current.filter(s => s !== name)
    emit('select-series', updated.length === 0 ? [] : updated)
  } else {
    emit('select-series', [...current, name])
  }
}

const selectAll = (): void => {
  if (props.seriesLoading) return
  emit('select-series', [])
}

watch(() => props.show, (val) => {
  if (val) {
    if (props.availableSeries.length > 1) {
      activeTab.value = 'serial'
    } else {
      activeTab.value = 'season'
    }
  }
})

watch(() => props.availableSeries, (val) => {
  if (val.length > 1 && activeTab.value !== 'serial') {
    activeTab.value = 'serial'
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="modal-overlay"
        @click.self="emit('close')"
        @keydown="handleKeydown"
      >
        <div class="modal-container">
          <div class="modal-header">
            <h2>Filters</h2>
            <button class="close-btn" aria-label="Close" @click="emit('close')">&times;</button>
          </div>

          <div v-if="tabs.length" class="tab-bar">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="['tab-btn', { active: activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <span v-if="tab.key === 'serial' && currentSeries.length" class="tab-badge">
                {{ currentSeries.length }}
              </span>
              <span v-else-if="tab.key !== 'serial' && selectedFilters[tab.key as keyof ActiveFilters].length" class="tab-badge">
                {{ selectedFilters[tab.key as keyof ActiveFilters].length }}
              </span>
            </button>
          </div>

          <div class="modal-body">
            <div v-if="loading" class="loading">Loading...</div>

            <template v-else>
              <div v-if="activeTab === 'serial'" class="serial-list">
                <button
                  :class="['serial-item', { active: currentSeries.length === 0 }]"
                  :disabled="seriesLoading"
                  @click="selectAll"
                >
                  Wszystkie
                </button>
                <button
                  v-for="s in availableSeries"
                  :key="s"
                  :class="['serial-item', { active: isSeriesSelected(s) }]"
                  :disabled="seriesLoading"
                  @click="toggleSeries(s)"
                >
                  {{ _formatSeriesName(s) }}
                </button>
              </div>

              <div v-if="!isSingleSeries && activeTab !== 'serial'" class="empty-msg">
                Wybierz jeden serial, aby uzyc filtrow
              </div>

              <template v-if="isSingleSeries">
                <SeasonTab
                  v-if="activeTab === 'season'"
                  :selected-filters="selectedFilters"
                  :seasons="seasons"
                  @toggle="(cat, val) => emit('toggle', cat, val)"
                />

                <div v-if="activeTab === 'episode'" class="chip-grid">
                  <template v-if="!selectedFilters.season.length">
                    <div class="empty-msg">Najpierw wybierz sezon</div>
                  </template>
                  <template v-else>
                    <button
                      v-for="ep in episodes"
                      :key="ep.number"
                      :class="['chip', { selected: isSelected('episode', String(ep.number)) }]"
                      @click="emit('toggle', 'episode', String(ep.number))"
                    >
                      {{ ep.title ? `E${ep.number} - ${ep.title}` : `Odcinek ${ep.number}` }}
                    </button>
                    <div v-if="!episodes.length" class="empty-msg">Brak odcinkow</div>
                  </template>
                </div>

                <SearchableTab
                  v-if="activeTab === 'character'"
                  :selected-filters="selectedFilters"
                  category="character"
                  :items="characters"
                  search-placeholder="Szukaj postaci..."
                  @toggle="(cat, val) => emit('toggle', cat, val)"
                  @remove="(cat, val) => emit('remove', cat, val)"
                />

                <ChipTab
                  v-if="activeTab === 'emotion'"
                  :selected-filters="selectedFilters"
                  category="emotion"
                  :items="emotions"
                  @toggle="(cat, val) => emit('toggle', cat, val)"
                />

                <SearchableTab
                  v-if="activeTab === 'object'"
                  :selected-filters="selectedFilters"
                  category="object"
                  :items="objects"
                  search-placeholder="Szukaj obiektu..."
                  @toggle="(cat, val) => emit('toggle', cat, val)"
                  @remove="(cat, val) => emit('remove', cat, val)"
                />
              </template>
            </template>
          </div>

          <div class="modal-footer">
            <button class="reset-btn" :disabled="applyLoading" @click="emit('reset')">Reset</button>
            <button class="apply-btn" :disabled="applyLoading" @click="emit('apply')">
              {{ applyLoading ? '...' : 'Apply' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  min-width: 100vw;
  min-height: 100vh;
  min-height: 100dvh;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
}

.modal-container {
  background: #f0f0f0;
  border-radius: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  border: 2px solid var(--color-secondary);
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f8f8;

  h2 {
    margin: 0;
    color: #333;
    font-size: 1.5rem;
    font-weight: 600;
  }
}

.close-btn {
  background: #e0e0e0;
  border: none;
  font-size: 1.5rem;
  color: #333;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  padding: 0;
  line-height: 1;

  &:hover {
    background: #d0d0d0;
  }
}

.tab-bar {
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f8f8;
  padding: 0 0.5rem;
  flex-shrink: 0;
}

.tab-btn {
  position: relative;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  white-space: nowrap;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;

  &.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  &:hover {
    color: #333;
  }
}

.tab-badge {
  position: absolute;
  top: 4px;
  right: 2px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.65rem;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1rem 1.5rem;
  overflow-y: auto;
  flex: 1;
  min-height: 200px;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #888;
}

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 2px solid #d0d0d0;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    border-color: var(--color-primary);
  }

  &.selected {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
  }
}

.empty-msg {
  color: #999;
  font-size: 0.85rem;
  padding: 1rem;
  text-align: center;
}

.serial-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 320px;
  overflow-y: auto;
  padding: 0.25rem;
}

.serial-item {
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 2px solid #d0d0d0;
  background: #fff;
  color: #333;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.75rem;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
  background: #f8f8f8;
  flex-shrink: 0;
}

.reset-btn,
.apply-btn {
  padding: 0.625rem 1.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn {
  background: #e0e0e0;
  color: #333;

  &:hover {
    background: #d0d0d0;
  }
}

.apply-btn {
  background: var(--color-primary);
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.2s;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.9);
}

@media (max-width: 600px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
  }

  .modal-header {
    padding: 1rem 1.25rem;
  }

  .modal-body {
    padding: 0.75rem 1rem;
  }

  .modal-footer {
    padding: 1rem 1.25rem;
  }

  .tab-btn {
    padding: 0.6rem 0.75rem;
    font-size: 0.8rem;
  }
}
</style>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ActiveFilters } from '@/types'

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
}

interface Emits {
  (e: 'close'): void
  (e: 'applied'): void
  (e: 'select-season', season: string): void
  (e: 'toggle', category: keyof ActiveFilters, value: string): void
  (e: 'remove', category: keyof ActiveFilters, value: string): void
  (e: 'apply'): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref<keyof ActiveFilters>('season')

const tabs: { key: keyof ActiveFilters; label: string }[] = [
  { key: 'season', label: 'Sezon' },
  { key: 'episode', label: 'Odcinek' },
  { key: 'character', label: 'Postacie' },
  { key: 'emotion', label: 'Emocje' },
  { key: 'object', label: 'Obiekty' }
]

const characterSearch = ref('')
const objectSearch = ref('')

const filteredCharacters = computed(() => {
  const q = characterSearch.value.toLowerCase()
  const selected = props.selectedFilters.character
  if (!q) return props.characters.filter(c => !selected.includes(c.name))
  return props.characters.filter(c =>
    !selected.includes(c.name) && c.name.toLowerCase().includes(q)
  )
})

const filteredObjects = computed(() => {
  const q = objectSearch.value.toLowerCase()
  const selected = props.selectedFilters.object.map(o => o.replace(/[><=]+\d*$/, ''))
  if (!q) return props.objects.filter(o => !selected.includes(o.name))
  return props.objects.filter(o =>
    !selected.includes(o.name) && o.name.toLowerCase().includes(q)
  )
})

const seasonKeys = computed(() => Object.keys(props.seasons).sort((a, b) => Number(a) - Number(b)))

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') emit('close')
}

const isSelected = (category: keyof ActiveFilters, value: string): boolean => {
  return props.selectedFilters[category].includes(value)
}

const toggle = (category: keyof ActiveFilters, value: string): void => {
  if (category === 'season') {
    emit('select-season', value)
  }
  emit('toggle', category, value)
}

const remove = (category: keyof ActiveFilters, value: string): void => {
  emit('remove', category, value)
}

watch(() => props.show, (val) => {
  if (val) {
    characterSearch.value = ''
    objectSearch.value = ''
    activeTab.value = 'season'
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

          <div class="tab-bar">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="['tab-btn', { active: activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <span v-if="selectedFilters[tab.key].length" class="tab-badge">
                {{ selectedFilters[tab.key].length }}
              </span>
            </button>
          </div>

          <div class="modal-body">
            <div v-if="loading" class="loading">Loading...</div>

            <template v-else>
              <!-- Season -->
              <div v-if="activeTab === 'season'" class="chip-grid">
                <button
                  v-for="key in seasonKeys"
                  :key="key"
                  :class="['chip', { selected: isSelected('season', key) }]"
                  @click="toggle('season', key)"
                >
                  Sezon {{ key }}
                </button>
                <div v-if="!seasonKeys.length" class="empty-msg">Brak sezonow</div>
              </div>

              <!-- Episode -->
              <div v-if="activeTab === 'episode'" class="chip-grid">
                <template v-if="!selectedFilters.season.length">
                  <div class="empty-msg">Najpierw wybierz sezon</div>
                </template>
                <template v-else>
                  <button
                    v-for="ep in episodes"
                    :key="ep.number"
                    :class="['chip', { selected: isSelected('episode', String(ep.number)) }]"
                    @click="toggle('episode', String(ep.number))"
                  >
                    {{ ep.title ? `E${ep.number} - ${ep.title}` : `Odcinek ${ep.number}` }}
                  </button>
                  <div v-if="!episodes.length" class="empty-msg">Brak odcinkow</div>
                </template>
              </div>

              <!-- Characters -->
              <div v-if="activeTab === 'character'" class="search-section">
                <div class="selected-chips">
                  <span
                    v-for="name in selectedFilters.character"
                    :key="name"
                    class="selected-chip"
                  >
                    {{ name }}
                    <button class="chip-remove" @click="remove('character', name)">&times;</button>
                  </span>
                </div>
                <input
                  v-model="characterSearch"
                  class="search-input"
                  placeholder="Szukaj postaci..."
                />
                <div class="option-list">
                  <button
                    v-for="char in filteredCharacters"
                    :key="char.name"
                    class="option-item"
                    @click="toggle('character', char.name)"
                  >
                    {{ char.name }}
                  </button>
                  <div v-if="!filteredCharacters.length" class="empty-msg">Brak wynikow</div>
                </div>
              </div>

              <!-- Emotions -->
              <div v-if="activeTab === 'emotion'" class="chip-grid">
                <button
                  v-for="emt in emotions"
                  :key="emt.name"
                  :class="['chip', { selected: isSelected('emotion', emt.name) }]"
                  @click="toggle('emotion', emt.name)"
                >
                  {{ emt.name }}
                </button>
                <div v-if="!emotions.length" class="empty-msg">Brak emocji</div>
              </div>

              <!-- Objects -->
              <div v-if="activeTab === 'object'" class="search-section">
                <div class="selected-chips">
                  <span
                    v-for="obj in selectedFilters.object"
                    :key="obj"
                    class="selected-chip"
                  >
                    {{ obj }}
                    <button class="chip-remove" @click="remove('object', obj)">&times;</button>
                  </span>
                </div>
                <input
                  v-model="objectSearch"
                  class="search-input"
                  placeholder="Szukaj obiektu..."
                />
                <div class="option-list">
                  <button
                    v-for="obj in filteredObjects"
                    :key="obj.name"
                    class="option-item"
                    @click="toggle('object', obj.name)"
                  >
                    {{ obj.name }}
                  </button>
                  <div v-if="!filteredObjects.length" class="empty-msg">Brak wynikow</div>
                </div>
              </div>
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
  border-top: 2px solid var(--color-secondary);
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

.search-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  min-height: 1.5rem;
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 16px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 500;
}

.chip-remove {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  line-height: 1;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }
}

.search-input {
  width: 100%;
  padding: 0.6rem 1rem;
  border-radius: 12px;
  border: 2px solid #d0d0d0;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: var(--color-primary);
  }
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
}

.option-item {
  text-align: left;
  padding: 0.5rem 1rem;
  border: none;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #333;
  transition: all 0.15s;

  &:hover {
    background: #e8e8e8;
  }
}

.empty-msg {
  color: #999;
  font-size: 0.85rem;
  padding: 1rem;
  text-align: center;
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

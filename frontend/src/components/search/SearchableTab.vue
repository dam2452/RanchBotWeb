<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ActiveFilters } from '@/types'

interface Props {
  selectedFilters: ActiveFilters
  category: keyof ActiveFilters
  items: { name: string }[]
  searchPlaceholder: string
}

interface Emits {
  (e: 'toggle', category: keyof ActiveFilters, value: string): void
  (e: 'remove', category: keyof ActiveFilters, value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')

const filteredItems = computed(() => {
  const q = searchQuery.value.toLowerCase()
  const selected = props.selectedFilters[props.category]
  const normalizeName = (name: string): string =>
    props.category === 'object' ? name.replace(/[><=]+\d*$/, '') : name

  const selectedNormalized = selected.map(normalizeName)
  const base = props.items.filter(item => !selectedNormalized.includes(item.name))
  if (!q) return base
  return base.filter(item => item.name.toLowerCase().includes(q))
})
</script>

<template>
  <div class="search-section">
    <div class="selected-chips">
      <span
        v-for="name in selectedFilters[category]"
        :key="name"
        class="selected-chip"
      >
        {{ name }}
        <button class="chip-remove" @click="emit('remove', category, name)">&times;</button>
      </span>
    </div>
    <input
      v-model="searchQuery"
      class="search-input"
      :placeholder="searchPlaceholder"
    />
    <div class="option-list">
      <button
        v-for="item in filteredItems"
        :key="item.name"
        class="option-item"
        @click="emit('toggle', category, item.name)"
      >
        {{ item.name }}
      </button>
      <div v-if="!filteredItems.length" class="empty-msg">Brak wynikow</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
</style>

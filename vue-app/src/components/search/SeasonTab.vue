<script setup lang="ts">
import type { ActiveFilters } from '@/types'

interface Props {
  selectedFilters: ActiveFilters
  seasons: Record<string, number>
}

interface Emits {
  (e: 'toggle', category: keyof ActiveFilters, value: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const seasonKeys = (seasons: Record<string, number>): string[] =>
  Object.keys(seasons).sort((a, b) => Number(a) - Number(b))

const isSelected = (values: string[], key: string): boolean => values.includes(key)
</script>

<template>
  <div class="chip-grid">
    <button
      v-for="key in seasonKeys(seasons)"
      :key="key"
      :class="['chip', { selected: isSelected(selectedFilters.season, key) }]"
      @click="emit('toggle', 'season', key)"
    >
      Sezon {{ key }}
    </button>
    <div v-if="!Object.keys(seasons).length" class="empty-msg">Brak sezonow</div>
  </div>
</template>

<style scoped lang="scss">
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
</style>

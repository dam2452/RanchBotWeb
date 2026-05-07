<script setup lang="ts">
import type { ActiveFilters } from '@/types'

interface Props {
  selectedFilters: ActiveFilters
  category: keyof ActiveFilters
  items: { name: string }[]
}

interface Emits {
  (e: 'toggle', category: keyof ActiveFilters, value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isSelected = (value: string): boolean =>
  props.selectedFilters[props.category].includes(value)
</script>

<template>
  <div class="chip-grid">
    <button
      v-for="item in items"
      :key="item.name"
      :class="['chip', { selected: isSelected(item.name) }]"
      @click="emit('toggle', category, item.name)"
    >
      {{ item.name }}
    </button>
    <div v-if="!items.length" class="empty-msg">Brak elementow</div>
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

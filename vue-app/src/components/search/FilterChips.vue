<script setup lang="ts">
import { computed } from 'vue'
import type { ActiveFilters } from '@/types'

interface Props {
  filters: ActiveFilters
}

interface Emits {
  (e: 'remove', category: keyof ActiveFilters, value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const categories: { key: keyof ActiveFilters; prefix: string }[] = [
  { key: 'season', prefix: 'S' },
  { key: 'episode', prefix: 'E' },
  { key: 'character', prefix: '' },
  { key: 'emotion', prefix: '' },
  { key: 'object', prefix: '' }
]

const activeCategories = computed(() =>
  categories.filter(cat => props.filters[cat.key].length > 0)
)
</script>

<template>
  <div v-if="activeCategories.length" class="filter-chips">
    <template v-for="cat in activeCategories" :key="cat.key">
      <span v-for="val in filters[cat.key]" :key="`${cat.key}-${val}`" class="chip">
        {{ cat.prefix ? `${cat.prefix}${val}` : val }}
        <button class="chip-x" @click="emit('remove', cat.key, val)">&times;</button>
      </span>
    </template>
  </div>
</template>

<style scoped lang="scss">
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  padding-top: 0.4rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.chip-x {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  line-height: 1;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
}
</style>

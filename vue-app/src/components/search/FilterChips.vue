<script setup lang="ts">
import type { ActiveFilters } from '@/types'

interface Props {
  filters: ActiveFilters
}

interface Emits {
  (e: 'remove', category: keyof ActiveFilters, value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div v-if="filters.season.length || filters.episode.length || filters.character.length || filters.emotion.length || filters.object.length" class="filter-chips">
    <span v-for="s in filters.season" :key="`s-${s}`" class="chip">
      S{{ s }}
      <button class="chip-x" @click="emit('remove', 'season', s)">&times;</button>
    </span>
    <span v-for="ep in filters.episode" :key="`ep-${ep}`" class="chip">
      E{{ ep }}
      <button class="chip-x" @click="emit('remove', 'episode', ep)">&times;</button>
    </span>
    <span v-for="c in filters.character" :key="c" class="chip">
      {{ c }}
      <button class="chip-x" @click="emit('remove', 'character', c)">&times;</button>
    </span>
    <span v-for="em in filters.emotion" :key="em" class="chip">
      {{ em }}
      <button class="chip-x" @click="emit('remove', 'emotion', em)">&times;</button>
    </span>
    <span v-for="obj in filters.object" :key="obj" class="chip">
      {{ obj }}
      <button class="chip-x" @click="emit('remove', 'object', obj)">&times;</button>
    </span>
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

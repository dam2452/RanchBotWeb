<script setup lang="ts">
import { ref } from 'vue'

interface Emits {
  (e: 'search', query: string): void
  (e: 'filters'): void
}

const emit = defineEmits<Emits>()
const query = ref('')

const handleSearch = () => {
  const trimmedQuery = query.value.trim()
  if (!trimmedQuery) return
  emit('search', trimmedQuery)
}

const handleFilters = () => {
  emit('filters')
}
</script>

<template>
  <form class="search-form" @submit.prevent="handleSearch">
    <div class="search-container">
      <!-- Search Input -->
      <input
        v-model="query"
        type="text"
        placeholder="Enter a quote"
        class="search-input"
        required
        autocomplete="off"
      />

      <!-- Search Button (inside input) -->
      <button type="submit" class="search-button" aria-label="Search">
        <img
          src="/images/ui/icons/arrow-circle-right.svg"
          alt="Search"
          class="search-icon"
        />
      </button>
    </div>

    <!-- Filters Button (right of input) -->
    <button type="button" class="filters-button" @click="handleFilters">
      Filters
    </button>
  </form>
</template>

<style scoped>
.search-form {
  display: flex;
  gap: 1rem;
  align-items: center;
  width: clamp(280px, 60vw, 720px);
  max-width: 90vw;
}

.search-container {
  position: relative;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: clamp(16px, 2vw, 24px) clamp(20px, 3vw, 32px);
  padding-right: clamp(60px, 6vw, 70px);
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 800;
  text-align: center;
  border: none;
  border-radius: 40px;
  background: #fff;
  color: #333;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
  transition: all 0.4s;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
}

.search-button {
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s;
}

.search-button:active {
  transform: translateY(-50%) scale(0.95);
}

.search-icon {
  width: clamp(30px, 4vw, 42px);
  height: auto;
  pointer-events: none;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.2s;
}

.search-button:hover .search-icon {
  transform: scale(1.15);
}

.filters-button {
  padding: clamp(10px, 1.5vw, 14px) clamp(16px, 2vw, 24px);
  font-size: clamp(1rem, 2.5vw, 1.6rem);
  font-weight: bold;
  border: none;
  border-radius: 40px;
  background: #888;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
  white-space: nowrap;
}

.filters-button:hover {
  background: #666;
  transform: scale(1.08);
}

.filters-button:active {
  transform: scale(0.95);
}

@media (max-width: 850px) {
  .search-form {
    width: 85vw;
    max-width: 500px;
    flex-direction: column;
    gap: 1rem;
  }

  .filters-button {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .search-form {
    width: 85vw;
  }

  .filters-button {
    padding: 8px 16px;
    font-size: 1rem;
  }
}
</style>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  initialQuery?: string
}

interface Emits {
  (e: 'search', query: string): void
}

const props = withDefaults(defineProps<Props>(), {
  initialQuery: ''
})

const emit = defineEmits<Emits>()
const query = ref(props.initialQuery)

watch(() => props.initialQuery, (newValue) => {
  query.value = newValue
})

const handleSubmit = () => {
  const trimmedQuery = query.value.trim()
  if (!trimmedQuery) return
  emit('search', trimmedQuery)
}
</script>

<template>
  <form class="search-form" @submit.prevent="handleSubmit">
    <input
      v-model="query"
      type="text"
      placeholder="Enter a quote"
      class="search-input"
      required
      autocomplete="off"
    />

    <button type="submit" class="search-button" aria-label="Search">
      <img
        src="/images/ui/icons/arrow-circle-right.svg"
        alt="Search"
        class="search-icon"
      />
    </button>
  </form>
</template>

<style scoped>
.search-form {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 16px 50px;
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  border: 3px solid transparent;
  border-radius: 40px;
  background: #fff;
  color: #333;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
  transition: all var(--transition-default);
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 30px rgba(255, 184, 92, 0.8), 0 12px 28px rgba(0, 0, 0, 0.4);
  border-color: #f2a94c;
}

.search-button {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform var(--transition-fast);
}

.search-button:active {
  transform: translateY(-50%) scale(0.95);
}

.search-icon {
  width: 30px;
  height: auto;
  pointer-events: none;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));
  transition: transform var(--transition-fast);
}

.search-button:hover .search-icon {
  transform: scale(1.15);
}

@media (min-width: 481px) {
  .search-input {
    padding: clamp(16px, 2vw, 20px) clamp(50px, 6vw, 60px);
    font-size: clamp(16px, 2.5vw, 1.6rem);
  }

  .search-button {
    width: 38px;
    height: 38px;
    right: clamp(10px, 1.5vw, 12px);
  }

  .search-icon {
    width: clamp(30px, 4vw, 35px);
  }
}

@media (min-width: 851px) {
  .search-input {
    padding: clamp(18px, 2vw, 24px) clamp(60px, 6vw, 70px);
    font-size: clamp(1.6rem, 2.5vw, 2rem);
  }

  .search-button {
    width: 42px;
    height: 42px;
    right: clamp(12px, 1.5vw, 15px);
  }

  .search-icon {
    width: clamp(35px, 4vw, 42px);
  }
}
</style>

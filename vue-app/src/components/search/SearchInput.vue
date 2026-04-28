<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  initialQuery?: string
  allowEmptySearch?: boolean
  semanticMode?: boolean
}

interface Emits {
  (e: 'search', query: string): void
  (e: 'toggle-semantic'): void
}

const props = withDefaults(defineProps<Props>(), {
  initialQuery: '',
  allowEmptySearch: false,
  semanticMode: false
})

const emit = defineEmits<Emits>()
const query = ref(props.initialQuery)

watch(() => props.initialQuery, (newValue) => {
  query.value = newValue
})

const handleSubmit = () => {
  const trimmedQuery = query.value.trim()
  if (!trimmedQuery && !props.allowEmptySearch) return
  emit('search', trimmedQuery)
}
</script>

<template>
  <form class="search-form" @submit.prevent="handleSubmit">
    <button
      type="button"
      class="semantic-button"
      :class="{ active: semanticMode }"
      aria-label="Toggle semantic search"
      @click="emit('toggle-semantic')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>

    <input
      v-model="query"
      type="text"
      placeholder="Enter a quote"
      class="search-input"
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

<style scoped lang="scss">
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

  &:focus {
    outline: none;
    box-shadow: 0 0 30px rgba(255, 184, 92, 0.8), 0 12px 28px rgba(0, 0, 0, 0.4);
    border-color: #f2a94c;
  }
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

  &:active {
    transform: translateY(-50%) scale(0.95);
  }
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

.semantic-button {
  position: absolute;
  top: 50%;
  left: 10px;
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
  color: #aaa;

  svg {
    width: 22px;
    height: 22px;
    pointer-events: none;
    filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.2));
    transition: all var(--transition-fast);
  }

  &:hover svg {
    transform: scale(1.15);
    color: #666;
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &.active {
    color: var(--color-primary);

    svg {
      filter: drop-shadow(0 0 6px rgba(242, 169, 76, 0.6));
    }

    &:hover svg {
      transform: scale(1.15);
    }
  }
}

@include mobile {
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

  .semantic-button {
    width: 38px;
    height: 38px;
    left: clamp(10px, 1.5vw, 12px);

    svg {
      width: clamp(22px, 3vw, 26px);
      height: clamp(22px, 3vw, 26px);
    }
  }
}

@include tablet {
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

  .semantic-button {
    width: 42px;
    height: 42px;
    left: clamp(12px, 1.5vw, 15px);

    svg {
      width: clamp(26px, 3.5vw, 32px);
      height: clamp(26px, 3.5vw, 32px);
    }
  }
}
</style>

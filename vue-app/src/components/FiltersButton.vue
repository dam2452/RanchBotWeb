<script setup lang="ts">
interface Emits {
  (e: 'click'): void
}

const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click')
}
</script>

<template>
  <button type="button" class="filters-button" @click="handleClick">
    Filters
  </button>
</template>

<style scoped>
.filters-button {
  position: absolute;
  bottom: -35px;
  right: 0;
  padding: 8px 16px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 20px;
  background: var(--color-button-bg);
  color: var(--color-text);
  cursor: pointer;
  box-shadow: var(--shadow-default);
  transform: rotate(5deg);
  transition: all var(--transition-default);
  white-space: nowrap;
}

.filters-button:hover {
  background: #666;
  transform: rotate(5deg) scale(1.08);
}

.filters-button:active {
  transform: rotate(5deg) scale(0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@media (min-width: 481px) {
  .filters-button {
    bottom: -40px;
    padding: clamp(10px, 1.5vw, 12px) clamp(18px, 2vw, 20px);
    font-size: clamp(16px, 2.5vw, 1.3rem);
    transform: rotate(5deg) translateY(-5px);
  }

  .filters-button:hover {
    transform: rotate(5deg) translateY(-5px) scale(1.08);
  }

  .filters-button:active {
    transform: rotate(5deg) translateY(-5px) scale(0.95);
  }
}

@media (min-width: 851px) {
  .filters-button {
    bottom: -50px;
    padding: clamp(12px, 1.5vw, 14px) clamp(20px, 2vw, 24px);
    font-size: clamp(1.3rem, 2.5vw, 1.6rem);
    transform: rotate(5deg);
  }

  .filters-button:hover {
    transform: rotate(5deg) scale(1.08);
  }

  .filters-button:active {
    transform: rotate(5deg) scale(0.95);
  }
}
</style>

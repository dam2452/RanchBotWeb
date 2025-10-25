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
  bottom: -50px;
  right: 8px;
  padding: clamp(10px, 1.5vw, 14px) clamp(16px, 2vw, 24px);
  font-size: clamp(1rem, 2.5vw, 1.6rem);
  font-weight: bold;
  border: none;
  border-radius: 20px;
  background: #888;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
  transform: rotate(5deg);
  transition: all 0.3s ease;
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

@media (max-width: 850px) {
  .filters-button {
    bottom: -40px;
    transform: rotate(5deg) translateY(-5px);
  }

  .filters-button:hover {
    transform: rotate(5deg) translateY(-5px) scale(1.08);
  }

  .filters-button:active {
    transform: rotate(5deg) translateY(-5px) scale(0.95);
  }
}

@media (max-width: 480px) {
  .filters-button {
    bottom: -35px;
    padding: 8px 16px;
    font-size: 1rem;
  }
}
</style>

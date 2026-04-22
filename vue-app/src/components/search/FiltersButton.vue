<script setup lang="ts">
interface Props {
  activeCount?: number
}

interface Emits {
  (e: 'click'): void
}

withDefaults(defineProps<Props>(), {
  activeCount: 0
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click')
}
</script>

<template>
  <button type="button" class="filters-button" @click="handleClick">
    Filters
    <span v-if="activeCount > 0" class="filter-badge">{{ activeCount }}</span>
  </button>
</template>

<style scoped lang="scss">
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

  &:hover {
    background: #666;
    transform: rotate(5deg) scale(1.08);
  }

  &:active {
    transform: rotate(5deg) scale(0.95);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  @include mobile {
    bottom: -40px;
    padding: clamp(10px, 1.5vw, 12px) clamp(18px, 2vw, 20px);
    font-size: clamp(16px, 2.5vw, 1.3rem);
    transform: rotate(5deg) translateY(-5px);

    &:hover {
      transform: rotate(5deg) translateY(-5px) scale(1.08);
    }

    &:active {
      transform: rotate(5deg) translateY(-5px) scale(0.95);
    }
  }

  @include tablet {
    bottom: -50px;
    padding: clamp(12px, 1.5vw, 14px) clamp(20px, 2vw, 24px);
    font-size: clamp(1.3rem, 2.5vw, 1.6rem);
    transform: rotate(5deg);

    &:hover {
      transform: rotate(5deg) scale(1.08);
    }

    &:active {
      transform: rotate(5deg) scale(0.95);
    }
  }
}

.filter-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

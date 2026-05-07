<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  disabled: false
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  if (!props.disabled) {
    emit('click')
  }
}
</script>

<template>
  <button
    :disabled="disabled"
    :class="['secondary-button', `button-${size}`]"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.secondary-button {
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  background: linear-gradient(to bottom right, #4CAF50, #45a049);
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  transition: all var(--transition-default);
  box-sizing: border-box;
}

.secondary-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.secondary-button:active:not(:disabled) {
  transform: scale(0.97);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-small {
  padding: 8px 16px;
  font-size: clamp(14px, 1.2vw, 16px);
}

.button-medium {
  padding: 12px 24px;
  font-size: clamp(16px, 1.5vw, 20px);
}

.button-large {
  padding: 16px 32px;
  font-size: clamp(20px, 1.5vw, 28px);
}
</style>

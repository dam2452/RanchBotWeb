<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

defineEmits<{
  click: []
}>()
</script>

<template>
  <button :class="['primary-button', `button-${size}`]" @click="$emit('click')">
    <slot />
  </button>
</template>

<style scoped>
.primary-button {
  background-color: #888;
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.primary-button:hover {
  transform: scale(1.05);
}

.primary-button:active {
  transform: scale(0.95);
}

.button-small {
  padding: 8px 16px;
  font-size: 0.8rem;
}

.button-medium {
  padding: 11px 22px;
  font-size: 0.95rem;
}

.button-large {
  padding: 16px 32px;
  font-size: clamp(1.2rem, 2vw, 2rem);
}

@media (min-width: 1200px) {
  .button-large {
    padding: 20px 40px;
  }
}
</style>

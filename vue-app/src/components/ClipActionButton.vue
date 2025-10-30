<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant: 'primary' | 'secondary' | 'danger' | 'success'
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small'
})

const emit = defineEmits<{
  click: []
}>()

const gradients = {
  primary: 'linear-gradient(145deg, #f2a94c, #e09340)',
  secondary: 'linear-gradient(145deg, #aaaaaa, #999999)',
  danger: 'linear-gradient(145deg, #ef4444, #dc2626)',
  success: 'linear-gradient(145deg, #1aa899, #159085)'
}

const positionStyles = computed(() => {
  const offset = props.size === 'large' ? '35px' : '12px'

  switch (props.position) {
    case 'top-left':
      return `top: ${offset}; left: ${offset};`
    case 'top-right':
      return `top: ${offset}; right: ${offset};`
    case 'bottom-left':
      return `bottom: ${offset}; left: ${offset};`
    case 'bottom-right':
      return `bottom: ${offset}; right: ${offset};`
  }
})

const sizes = {
  small: 'px-6 py-4 text-xs',
  medium: 'px-8 py-4 text-sm',
  large: 'px-12 py-4 text-sm'
}

const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('click')
}
</script>

<template>
  <button
    :style="`background: ${gradients[variant]}; color: white; ${positionStyles}`"
    :class="[
      sizes[size],
      'clip-action-btn absolute border-none rounded-full font-medium leading-[1.4] z-[100] transition-all duration-200 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95'
    ]"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

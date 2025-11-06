<script setup lang="ts">
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

const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('click')
}
</script>

<template>
  <button
    class="clip-action-btn"
    :class="[
      `variant-${variant}`,
      `position-${position}`,
      `size-${size}`
    ]"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.clip-action-btn {
  position: absolute;
  border: none;
  border-radius: 50px;
  font-weight: 500;
  line-height: 1.4;
  color: white;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.clip-action-btn:hover {
  transform: scale(1.05);
}

.clip-action-btn:active {
  transform: scale(0.95);
}

.variant-primary {
  background: linear-gradient(145deg, #f2a94c, #e09340);
}

.variant-secondary {
  background: linear-gradient(145deg, #aaaaaa, #999999);
}

.variant-danger {
  background: linear-gradient(145deg, #ef4444, #dc2626);
}

.variant-success {
  background: linear-gradient(145deg, #1aa899, #159085);
}

.size-small {
  padding: 8px 12px;
  font-size: 11px;
}

.size-medium {
  padding: 10px 16px;
  font-size: 12px;
}

.size-large {
  padding: 12px 24px;
  font-size: 13px;
}

.position-top-left.size-small,
.position-top-left.size-medium {
  top: 8px;
  left: 8px;
}

.position-top-left.size-large {
  top: 12px;
  left: 12px;
}

.position-top-right.size-small,
.position-top-right.size-medium {
  top: 8px;
  right: 8px;
}

.position-top-right.size-large {
  top: 12px;
  right: 12px;
}

.position-bottom-left.size-small,
.position-bottom-left.size-medium {
  bottom: 8px;
  left: 8px;
}

.position-bottom-left.size-large {
  bottom: 12px;
  left: 12px;
}

.position-bottom-right.size-small,
.position-bottom-right.size-medium {
  bottom: 8px;
  right: 8px;
}

.position-bottom-right.size-large {
  bottom: 12px;
  right: 12px;
}

@media (min-width: 851px) {
  .size-small {
    padding: 12px 20px;
    font-size: 13px;
  }

  .size-medium {
    padding: 14px 24px;
    font-size: 14px;
  }

  .size-large {
    padding: 16px 32px;
    font-size: 15px;
  }

  .position-top-left.size-small,
  .position-top-left.size-medium {
    top: 16px;
    left: 16px;
  }

  .position-top-left.size-large {
    top: 20px;
    left: 20px;
  }

  .position-top-right.size-small,
  .position-top-right.size-medium {
    top: 16px;
    right: 16px;
  }

  .position-top-right.size-large {
    top: 20px;
    right: 20px;
  }

  .position-bottom-left.size-small,
  .position-bottom-left.size-medium {
    bottom: 16px;
    left: 16px;
  }

  .position-bottom-left.size-large {
    bottom: 20px;
    left: 20px;
  }

  .position-bottom-right.size-small,
  .position-bottom-right.size-medium {
    bottom: 16px;
    right: 16px;
  }

  .position-bottom-right.size-large {
    bottom: 20px;
    right: 20px;
  }
}
</style>

<script setup lang="ts">
interface Props {
  direction?: 'horizontal' | 'vertical'
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'vertical',
  size: 'small'
})
</script>

<template>
  <div :class="['arrow-container', `arrow-${size}`, `arrow-${direction}`]">
    <img
      src="/images/ui/icons/arrow.svg"
      :class="['arrow', `arrow-${direction}`]"
      alt="Arrow"
    />
  </div>
</template>

<style scoped>
.arrow-container {
  transition: all 0.4s;
  display: inline-block;
}

.arrow {
  display: block;
  width: 100%;
  height: auto;
}

.arrow-vertical .arrow {
  animation: arrow-bounce-vertical 1.8s ease-in-out infinite;
}

.arrow-horizontal .arrow {
  animation: arrow-bounce-horizontal 1.8s ease-in-out infinite;
}

.arrow-small {
  width: 54px;
  height: auto;
}

.arrow-medium {
  width: 30px;
  height: auto;
}

.arrow-large {
  width: 120px;
  height: auto;
}

@keyframes arrow-bounce-horizontal {
  0%, 100% {
    transform: translateX(0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: translateX(8px) scale(1.05);
    opacity: 1;
  }
}

@keyframes arrow-bounce-vertical {
  0%, 100% {
    transform: rotate(90deg) translateX(0) scale(1);
    opacity: 0.85;
  }
  50% {
    transform: rotate(90deg) translateX(8px) scale(1.05);
    opacity: 1;
  }
}
</style>

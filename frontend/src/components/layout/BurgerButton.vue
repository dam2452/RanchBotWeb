<template>
  <button class="burger-btn" :class="{ open }" :aria-label="open ? 'Close menu' : 'Open menu'" @click="$emit('click')">
    <span class="line line--top" />
    <span class="line line--mid" />
    <span class="line line--bot" />
  </button>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ (e: 'click'): void }>()
</script>

<style scoped lang="scss">
.burger-btn {
  position: fixed;
  top: calc(var(--layout-header-top, 1.5rem) + env(safe-area-inset-top));
  right: calc(1.25rem + env(safe-area-inset-right));
  z-index: 10000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: #888;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s, transform 0.15s;

  &:hover { background: #666; }
  &:active { transform: scale(0.93); }
}

.line {
  display: block;
  width: 22px;
  height: 2.5px;
  border-radius: 2px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s, background 0.3s;
  transform-origin: center;
}

.line--top { background: #f2a94c; }
.line--mid { background: #fff; }
.line--bot { background: #fff; }

.open {
  .line--top {
    transform: translateY(7.5px) rotate(45deg);
    background: #f2a94c;
  }
  .line--mid {
    opacity: 0;
    transform: scaleX(0);
  }
  .line--bot {
    transform: translateY(-7.5px) rotate(-45deg);
    background: #fff;
  }
}
</style>

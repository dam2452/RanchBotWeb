<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BrandLogo from './BrandLogo.vue'

const windowWidth = ref(window.innerWidth)

const isWatchView = computed(() => windowWidth.value <= 196)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <router-link v-if="!isWatchView" to="/" class="logo-header">
    <BrandLogo size="small" class="logo-brand" />
    <span class="logo-text">RanchBot</span>
  </router-link>
</template>

<style scoped lang="scss">
.logo-header {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 1010;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  text-decoration: none;
  transition: opacity var(--transition-default);

  &:hover {
    opacity: 0.8;
  }

  &:active,
  &:visited {
    text-decoration: none;
  }
}

.logo-brand {
  transform: scale(0.44);
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.3));
}

.logo-text {
  display: none;
  color: white;
  font-weight: bold;
  font-size: 3rem;
  letter-spacing: -0.025em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@include tablet {
  .logo-header {
    top: 2rem;
    left: 2rem;
    gap: 2rem;
  }

  .logo-brand {
    transform: scale(0.77);
  }

  .logo-text {
    display: block;
  }
}
</style>

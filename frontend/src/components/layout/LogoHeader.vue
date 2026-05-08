<script setup lang="ts">
import { computed } from 'vue'
import BrandLogo from './BrandLogo.vue'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { WATCH_BREAKPOINT } from '@/utils/formatters'

interface Props {
  hideText?: boolean
  indentLeft?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hideText: false,
  indentLeft: false,
})

const { windowWidth } = useWindowWidth()

const isWatchView = computed(() => windowWidth.value <= WATCH_BREAKPOINT)
</script>

<template>
  <router-link v-if="!isWatchView" to="/" class="logo-header" :class="{ 'logo-header--compact': props.hideText, 'logo-header--indented': props.indentLeft }">
    <BrandLogo size="small" class="logo-brand" />
    <span v-if="!props.hideText" class="logo-text">RanchBot</span>
  </router-link>
</template>

<style scoped lang="scss">
.logo-header {
  position: fixed;
  top: calc(var(--layout-header-top, 1.5rem) + env(safe-area-inset-top));
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
  transition: transform 0.3s ease;
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
    left: 2rem;
    gap: 2rem;
  }

  .logo-brand {
    transform: scale(0.77);
  }

  .logo-text {
    display: block;
  }

  .logo-header--compact .logo-brand {
    transform: scale(1.05);
  }

  .logo-header--indented {
    left: calc(2rem + 2.75rem + 1rem);
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import BrandLogo from './BrandLogo.vue'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { WATCH_BREAKPOINT, MOBILE_BREAKPOINT } from '@/utils/formatters'

const { windowWidth } = useWindowWidth()

const logoSize = computed(() => {
  if (windowWidth.value <= WATCH_BREAKPOINT) return 'small'
  if (windowWidth.value > MOBILE_BREAKPOINT) return 'large'
  return 'medium'
})
</script>

<template>
  <section class="logo-section">
    <BrandLogo :size="logoSize" class="logo-brand" />
    <h1 class="title">RanchBot</h1>
  </section>
</template>

<style scoped lang="scss">
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: 1.5rem auto 0.2rem auto;
  flex: none;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.logo-brand {
  transform: scale(1.0);
}

.title {
  font-size: clamp(3.5rem, 6vw, 7rem);
  margin: 0.3rem 0;
  transition: all var(--transition-default);
}

@include mobile {
  .logo-section {
    margin: 2rem auto 0.2rem auto;
  }

  .title {
    margin: 0.4rem 0;
  }
}

@include tablet {
  .logo-section {
    flex: 1;
    max-width: 50%;
    margin: 0;
  }

  .logo-brand {
    transform: scale(1.0);
  }

  .title {
    font-size: clamp(4.63rem, 7.94vw, 9.26rem);
    margin: 0.5rem 0;
  }
}
</style>

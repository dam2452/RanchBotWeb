<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { WATCH_BREAKPOINT } from '@/utils/formatters'
import UserButtons from '@/components/layout/UserButtons.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import AnimatedArrow from '@/components/common/AnimatedArrow.vue'
import HeroImage from '@/components/search/HeroImage.vue'

const router = useRouter()
const authStore = useAuthStore()
const { windowWidth, windowHeight } = useWindowWidth()

const arrowSize = computed(() => {
  if (windowWidth.value >= 1200) return 'large'
  if (windowWidth.value >= 481) return 'medium'
  return 'small'
})

const arrowDirection = computed(() => {
  const isPortrait = windowHeight.value > windowWidth.value
  if (isPortrait) return 'vertical'
  return windowWidth.value >= 1200 ? 'horizontal' : 'vertical'
})

const goToSearch = () => router.push(authStore.isAuthenticated ? '/search' : '/login')
</script>

<template>
  <UserButtons v-if="windowWidth > WATCH_BREAKPOINT" fixed />
  <AppFooter v-if="windowWidth > WATCH_BREAKPOINT" />

  <main class="home-main">
    <div v-if="windowWidth <= WATCH_BREAKPOINT" class="watch-view">
      <PrimaryButton size="small" @click="goToSearch">{{ authStore.isAuthenticated ? 'Search' : 'Login' }}</PrimaryButton>
    </div>

    <div v-else class="full-view">
      <div class="content-section">
        <BrandLogo class="logo" size="large" />
        <h1 class="title">RanchBot</h1>
        <p class="tagline">Find, cut, and share your favorite Ranczo scene — in seconds.</p>
        <PrimaryButton class="cta-button" size="large" @click="goToSearch">enter a quote</PrimaryButton>
      </div>

      <AnimatedArrow class="arrow-section" :direction="arrowDirection" :size="arrowSize" />

      <div class="image-section">
        <HeroImage size="large" />
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.home-main {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  background: var(--gradient-main);
  text-align: center;

  @include desktop-up {
    max-width: 1500px;
  }
}

.watch-view {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.full-view {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  padding: 0 var(--spacing-sm) var(--spacing-sm);
  padding-top: 0;
  gap: 4px;

  @include mobile {
    padding: var(--spacing-lg) var(--spacing-md);
    padding-top: var(--spacing-lg);
    gap: 12px;
  }

  @include desktop-up {
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-xl);
    gap: 30px;
    text-align: left;
  }
}

.content-section {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 var(--spacing-sm);
  transition: all var(--transition-default);

  @include mobile {
    max-width: 600px;
    padding: 0;
  }

  @include desktop-up {
    max-width: 480px;
    padding-right: 0;
  }
}

.logo {
  margin-top: -110px;
  transform: scale(0.7);

  @include mobile {
    transform: scale(0.85);
  }

  @include desktop-up {
    margin-top: 0;
    transform: scale(1);
  }
}

.title {
  text-align: center;
  margin: 3px 15px 2px;
  font-size: 1.6rem;
  transition: all var(--transition-default);

  @include mobile {
    margin: var(--spacing-lg) 0 10px;
    font-size: clamp(2.2rem, 8vw, 5rem);
  }

  @include desktop-up {
    font-size: clamp(3rem, 5vw, 5.5rem);
    margin: 15px 0 10px;
  }

  @include large {
    font-size: clamp(4rem, 5vw, 8rem);
  }
}

.tagline {
  text-align: center;
  margin: 0 15px 3px;
  font-size: 0.8rem;

  @include mobile {
    margin: var(--spacing-lg) 0;
    font-size: clamp(1.1rem, 2.5vw, 1.8rem);
  }

  @include desktop-up {
    font-size: clamp(1.2rem, 2.5vw, 1.8rem);
    margin: 10px 0 15px;
  }
}

.cta-button {
  margin-bottom: 3px;

  @include desktop-up {
    margin-bottom: 0;
  }
}

.arrow-section {
  margin: 15px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 10;

  @include desktop-up {
    flex: 0 0 auto;
    position: relative;
    transform: none;
    z-index: 20;
    margin: 0 20px;
  }
}

.image-section {
  flex: 0 0 auto;
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-default);

  @include mobile {
    max-width: 600px;
    margin-top: 15px;
  }

  @include desktop-up {
    flex: 0 0 auto;
    max-width: 800px;
    margin-right: 0;
    margin-top: 0;
    position: relative;
    z-index: 1;
  }
}

@media (min-width: 2560px) {
  .home-main {
    max-width: 2400px;
  }
}

@media (min-width: 3840px) {
  .home-main {
    max-width: 3200px;
  }

  .title {
    font-size: clamp(5rem, 4vw, 9rem);
  }

  .tagline {
    font-size: clamp(2rem, 2.5vw, 3rem);
  }
}

@media (orientation: portrait) and (min-width: 1080px) {
  .home-main {
    max-width: 800px;
  }

  .full-view {
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 60px;
    gap: 15px;
  }

  .content-section {
    max-width: 100%;
    text-align: center;
  }

  .title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    margin: 20px 0 15px;
  }

  .tagline {
    font-size: clamp(1.2rem, 3vw, 2rem);
    margin: 15px 0 20px;
  }

  .arrow-section {
    position: static;
    transform: none;
    margin: 15px auto;
  }

  .image-section {
    margin-right: 0;
    max-width: 600px;
    margin-top: 20px;
  }
}
</style>

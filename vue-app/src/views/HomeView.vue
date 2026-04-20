<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserButtons from '@/components/layout/UserButtons.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import AnimatedArrow from '@/components/common/AnimatedArrow.vue'
import HeroImage from '@/components/search/HeroImage.vue'

const router = useRouter()
const authStore = useAuthStore()

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

const isPortrait = computed(() => {
  return windowHeight.value > windowWidth.value
})

const arrowSize = computed(() => {
  if (windowWidth.value >= 1200) return 'large'
  if (windowWidth.value >= 481) return 'medium'
  return 'small'
})

const arrowDirection = computed(() => {
  if (isPortrait.value) return 'vertical'
  return windowWidth.value >= 1200 ? 'horizontal' : 'vertical'
})

const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const goToLogin = () => {
  router.push('/login')
}

const goToSearch = () => {
  router.push('/search')
}
</script>

<template>
  <UserButtons v-if="windowWidth > 196" fixed />
  <AppFooter v-if="windowWidth > 196" />

  <main class="home-main">
    <div v-if="windowWidth <= 196" class="watch-view">
      <PrimaryButton v-if="!authStore.isAuthenticated" size="small" @click="goToLogin">Login</PrimaryButton>
      <PrimaryButton v-else size="small" @click="goToSearch">Search</PrimaryButton>
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

<style scoped>
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
}

.content-section {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 var(--spacing-sm);
  transition: all var(--transition-default);
}

.logo {
  margin-top: -110px;
  transform: scale(0.7);
}

.title {
  text-align: center;
  margin: 3px 15px 2px;
  font-size: 1.6rem;
  transition: all var(--transition-default);
}

.tagline {
  text-align: center;
  margin: 0 15px 3px;
  font-size: 0.8rem;
}

.cta-button {
  margin-bottom: 3px;
}

.arrow-section {
  margin: 15px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.image-section {
  flex: 0 0 auto;
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-default);
}

@media (min-width: 481px) {
  .full-view {
    padding: var(--spacing-lg) var(--spacing-md);
    padding-top: var(--spacing-lg);
    gap: 12px;
  }

  .content-section {
    max-width: 600px;
    padding: 0;
  }

  .logo {
    transform: scale(0.85);
  }

  .title {
    margin: var(--spacing-lg) 0 10px;
    font-size: clamp(2.2rem, 8vw, 5rem);
  }

  .tagline {
    margin: var(--spacing-lg) 0;
    font-size: clamp(1.1rem, 2.5vw, 1.8rem);
  }

  .image-section {
    max-width: 600px;
    margin-top: 15px;
  }
}

@media (min-width: 1200px) {
  .home-main {
    max-width: 1500px;
  }

  .full-view {
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-xl);
    gap: 30px;
    text-align: left;
  }

  .content-section {
    flex: 0 0 auto;
    max-width: 480px;
    padding-right: 0;
  }

  .logo {
    margin-top: 0;
    transform: scale(1);
  }

  .title {
    font-size: clamp(3rem, 5vw, 5.5rem);
    margin: 15px 0 10px;
  }

  .tagline {
    font-size: clamp(1.2rem, 2.5vw, 1.8rem);
    margin: 10px 0 15px;
  }

  .cta-button {
    margin-bottom: 0;
  }

  .arrow-section {
    flex: 0 0 auto;
    position: relative;
    transform: none;
    z-index: 20;
    margin: 0 20px;
  }

  .image-section {
    flex: 0 0 auto;
    max-width: 800px;
    margin-right: 0;
    margin-top: 0;
    position: relative;
    z-index: 1;
  }
}

@media (min-width: 1800px) {
  .title {
    font-size: clamp(4rem, 5vw, 8rem);
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

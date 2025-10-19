<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToSearch = () => {
  router.push('/search')
}
</script>

<template>
  <main class="hero">
    <div class="left-col">
      <router-link to="/">
        <img src="/images/branding/logo.svg" class="logo-img" alt="RanchBot Logo" />
      </router-link>
      <h1>RanchBot</h1>
      <p class="tagline">Find, cut, and share your favorite Ranczo scene — in seconds.</p>
      <button class="quote-btn" @click="goToSearch">enter a quote</button>

      <div class="arrow-wrapper">
        <img src="/images/ui/icons/arrow.svg" class="arrow-img" alt="Arrow" />
      </div>
    </div>

    <div class="right-col">
      <router-link to="/search" class="preview-link">
        <img src="/images/others/KusyDworek.png" class="preview-img" alt="Dworek Kusy" />
      </router-link>
    </div>
  </main>
</template>

<style scoped>
@import '@/assets/styles/css/pages/home.css';
</style>

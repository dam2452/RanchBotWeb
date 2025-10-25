<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppHeader from './components/AppHeader.vue'

const route = useRoute()

const showHeader = computed(() => {
  const noHeaderRoutes = ['home', 'login', 'register', 'forgot-password', 'search', 'search-results', 'my-clips']
  return !noHeaderRoutes.includes(route.name as string)
})
</script>

<template>
  <div id="app">
    <AppHeader v-if="showHeader" />
    <RouterView />
  </div>
</template>

<style>
@import '@/assets/styles/css/base/reset.css';
@import '@/assets/styles/css/base/variables.css';
@import '@/assets/styles/css/base/typography.css';
@import '@/assets/styles/css/layouts/common.css';
@import '@/assets/styles/css/layouts/page-layouts.css';
@import '@/assets/styles/css/components/buttons.css';
@import '@/assets/styles/css/components/forms.css';
@import '@/assets/styles/css/utils/helpers.css';
@import '@/assets/styles/css/utils/animations.css';
@import '@/assets/styles/css/utils/media-queries.css';

* {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
  font-weight: 600;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>

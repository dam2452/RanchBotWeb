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
* {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
  font-weight: 600;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>

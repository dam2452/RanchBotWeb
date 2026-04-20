<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import AppHeader from './components/layout/AppHeader.vue'

const route = useRoute()
const authStore = useAuthStore()

const showHeader = computed(() => {
  const noHeaderRoutes = ['home', 'login', 'register', 'forgot-password', 'search', 'search-results', 'my-clips', 'error', 'not-found']
  return !noHeaderRoutes.includes(route.name as string)
})

onMounted(async () => {
  await authStore.checkAuth()
})
</script>

<template>
  <div id="app">
    <AppHeader v-if="showHeader" />
    <RouterView />
  </div>
</template>

<style>
:root {
  color-scheme: light only;
}

* {
  font-family: 'Verdana', sans-serif;
  font-weight: 600;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  height: -webkit-fill-available;
  overflow: hidden;
  background: linear-gradient(to bottom, #1aa899, #f2a94c) !important;
  color: #fff !important;
  position: fixed;
  width: 100%;
  color-scheme: light only;
}

#app {
  width: 100%;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  background: linear-gradient(to bottom, #1aa899, #f2a94c) !important;
  box-sizing: border-box;
  color-scheme: light only;
}

@media (prefers-color-scheme: dark) {
  html,
  body,
  #app {
    background: linear-gradient(to bottom, #1aa899, #f2a94c) !important;
    color: #fff !important;
    filter: none !important;
  }
}
</style>

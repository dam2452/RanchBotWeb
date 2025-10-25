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
  font-family: 'Verdana', sans-serif;
  font-weight: 600;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, #1aa899, #f2a94c) !important;
  color: #fff;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>

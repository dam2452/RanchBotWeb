<script setup lang="ts">
import { RouterView } from 'vue-router'
import BurgerMenu from './components/layout/BurgerMenu.vue'
import InstallBanner from './components/common/InstallBanner.vue'
</script>

<template>
  <div id="app">
    <InstallBanner />
    <BurgerMenu />
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

html {
  margin: 0;
  padding: 0;
  height: 100%;
  font-size: clamp(13px, 1vw, 16px);
  background-color: #f2a94c;
  color-scheme: light only;
  touch-action: pan-x pan-y;
}

body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, #1aa899, #f2a94c) !important;
  background-attachment: fixed !important;
  color: #fff !important;
  position: fixed;
  width: 100%;
  color-scheme: light only;
  touch-action: pan-x pan-y;
}

button, a, input, select, textarea, [role="button"] {
  touch-action: manipulation;
}

#app {
  width: 100%;
  height: 100%;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  background: linear-gradient(to bottom, #1aa899, #f2a94c) !important;
  box-sizing: border-box;
  color-scheme: light only;
}

@media (prefers-color-scheme: dark) {
  html {
    background-color: #f2a94c !important;
    filter: none !important;
  }

  body,
  #app {
    background: linear-gradient(to bottom, #1aa899, #f2a94c) !important;
    color: #fff !important;
    filter: none !important;
  }
}
</style>

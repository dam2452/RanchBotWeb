<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <p>&copy; {{ year }} RanchBot. All rights reserved.</p>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  position: fixed;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  left: env(safe-area-inset-left);
  right: env(safe-area-inset-right);
  z-index: 1000;
  text-align: center;

  @include short-height {
    display: none;
  }
}

.app-footer p {
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.7;
  margin: 0;
}
</style>

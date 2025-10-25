<script setup lang="ts">
</script>

<template>
  <router-link to="/" class="logo-header">
    <img src="/images/branding/logo.svg" alt="RanchBot Logo" />
    <span>RanchBot</span>
  </router-link>
</template>

<style scoped>
.logo-header {
  position: fixed;
  top: 2rem;
  left: 2rem;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 2rem;
  text-decoration: none;
  transition: opacity 0.3s;
}

.logo-header:hover {
  opacity: 0.8;
}

.logo-header:active,
.logo-header:visited {
  text-decoration: none;
}

.logo-header img {
  width: 7rem;
  height: 7rem;
}

.logo-header span {
  color: white;
  font-weight: bold;
  font-size: 3rem;
  letter-spacing: -0.025em;
}

@media (max-width: 850px) {
  .logo-header {
    top: 1.5rem;
    left: 1.5rem;
    gap: 1.5rem;
  }

  .logo-header img {
    width: 5rem;
    height: 5rem;
  }

  .logo-header span {
    font-size: 2.25rem;
  }
}
</style>

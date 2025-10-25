<script setup lang="ts">
</script>

<template>
  <section class="logo-section">
    <router-link to="/" class="logo-link">
      <img
        src="/images/branding/logo.svg"
        alt="RanchBot Logo"
        class="logo"
      />
    </router-link>
    <h1 class="title">RanchBot</h1>
  </section>
</template>

<style scoped>
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.25rem;
}

.logo-link {
  display: inline-block;
}

.logo {
  width: clamp(200px, 20vw, 300px);
}

.title {
  font-size: clamp(3.5rem, 6vw, 7rem);
  margin: 1.25rem 0;
}
</style>

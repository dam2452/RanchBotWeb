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
  margin: 0;
  flex: 1;
  max-width: 50%;
  box-sizing: border-box;
}

.logo-link {
  display: inline-block;
}

.logo {
  width: clamp(200px, 20vw, 300px);
}

.title {
  font-size: clamp(3.5rem, 6vw, 7rem);
  margin: 0.5rem 0;
}

@media (min-width: 851px) {
  .logo {
    width: clamp(390px, 39vw, 585px);
  }

  .title {
    font-size: clamp(4.63rem, 7.94vw, 9.26rem);
  }
}

@media (max-width: 850px) {
  .logo-section {
    margin: 0.5rem auto 0.2rem auto;
    flex: none;
    max-width: 100%;
    width: 100%;
  }

  .title {
    margin: 0.3rem 0;
  }
}
</style>

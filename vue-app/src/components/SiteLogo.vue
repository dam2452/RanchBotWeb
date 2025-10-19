<template>
  <router-link to="/" class="site-logo-container">
    <img src="/images/branding/logo.svg" alt="Logo strony" class="site-logo" />
    <div class="site-name">RanchBot</div>
  </router-link>
</template>

<style scoped>
.site-logo-container {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
}

.site-logo {
  width: 180px;
  height: auto;
  cursor: pointer;
}

.site-name {
  font-size: 28px;
  font-weight: bold;
  color: var(--color-text-light);
  margin-top: 7px;
  text-align: center;
}

@media screen and (max-width: 850px) {
  .site-logo-container {
    top: 20px;
    left: 20px;
    position: fixed;
    z-index: 1001;
  }

  .site-logo {
    width: 80px;
  }

  .site-name {
    font-size: 16px;
  }
}
</style>

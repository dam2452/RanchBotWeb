<script setup lang="ts">
</script>

<template>
  <main class="page-container static-page">
    <div class="message-box info-box">
      <h1>Registration</h1>
      <p class="important-message">Registration of new users is currently disabled.</p>
      <p>The application is in closed beta. To get access, please contact the administrator.</p>
      <p class="login-link-container">Already have an account?</p>
      <router-link to="/login" class="action-button">Log in</router-link>
    </div>
  </main>
</template>

<style scoped>
@import '@/assets/styles/css/pages/register.css';
</style>

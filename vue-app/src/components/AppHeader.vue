<template>
  <header>
    <div class="auth-buttons">
      <template v-if="authStore.isAuthenticated">
        <div class="tooltip-container">
          <button id="user-welcome-link" title="Click to check your subscription">
            Hi, {{ authStore.user?.username }}
          </button>
          <div id="subscription-tooltip" class="subscription-tooltip"></div>
        </div>
        <button @click="$router.push('/my-clips')">My Clips</button>
        <button @click="handleLogout">Logout</button>
      </template>
      <template v-else>
        <button @click="$router.push('/login')">Login</button>
        <button @click="$router.push('/register')">Register</button>
      </template>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
@import '@/assets/styles/css/pages/header.css';
</style>

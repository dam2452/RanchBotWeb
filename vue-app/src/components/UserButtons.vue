<template>
  <div class="auth-buttons" :class="{ 'fixed-position': fixed }">
    <template v-if="authStore.isAuthenticated">
      <button id="user-welcome-link" :title="showTooltip ? 'Click to check your subscription' : ''">
        Hi, {{ authStore.user?.username }}
      </button>
      <button v-if="showMyClips" @click="$router.push('/my-clips')">My Clips</button>
      <button @click="handleLogout">Logout</button>
    </template>
    <template v-else>
      <button @click="$router.push('/login')">Login</button>
      <button @click="$router.push('/register')">Register</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

interface Props {
  fixed?: boolean
  showMyClips?: boolean
  showTooltip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fixed: false,
  showMyClips: true,
  showTooltip: true
})

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.auth-buttons.fixed-position {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}
</style>

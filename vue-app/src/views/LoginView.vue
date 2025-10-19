<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const login = ref('')
const password = ref('')
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''

  const success = await authStore.login({
    login: login.value,
    password: password.value,
  })

  if (success) {
    router.push('/search')
  } else {
    errorMessage.value = authStore.error || 'Login failed'
  }
}
</script>

<template>
  <main>
    <section class="left">
      <router-link to="/">
        <img src="/images/branding/logo.svg" class="logo-img" alt="RanchBot Logo" />
      </router-link>
      <h1>RanchBot</h1>
    </section>

    <section class="right">
      <div class="bench-container">
        <img src="/images/others/bench.svg" alt="Bench Graphic" class="bench-image" />
        <form class="form-overlay" @submit.prevent="handleSubmit">
          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <input v-model="login" type="text" name="login" placeholder="login" required autofocus />
          <input
            v-model="password"
            type="password"
            name="password"
            placeholder="password"
            required
          />
          <button type="submit" :disabled="authStore.loading">
            {{ authStore.loading ? 'Logging in...' : 'Zaloguj się' }}
          </button>
        </form>
      </div>

      <div class="actions">
        <button @click="$router.push('/register')">Create account ?</button>
        <button @click="$router.push('/forgot-password')">Forgot password ?</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
@import '@/assets/styles/css/pages/login.css';
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LogoSection from '@/components/LogoSection.vue'
import LoginForm from '@/components/LoginForm.vue'
import ActionButtons from '@/components/ActionButtons.vue'

const router = useRouter()
const authStore = useAuthStore()
const errorMessage = ref('')

const handleSubmit = async (credentials: { login: string; password: string }) => {
  errorMessage.value = ''

  const success = await authStore.login(credentials)

  if (success) {
    router.push('/search')
  } else {
    errorMessage.value = authStore.error || 'Login failed'
  }
}
</script>

<template>
  <main class="login-page">
    <LogoSection />

    <section class="login-section">
      <LoginForm
        :loading="authStore.loading"
        :error="errorMessage"
        @submit="handleSubmit"
      />

      <ActionButtons />
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: calc(100dvh - 70px);
  box-sizing: border-box;
  padding: 2.5rem;
}

.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (max-width: 850px) {
  .login-page {
    height: auto;
    flex-direction: column;
    padding-top: 0.9375rem;
    padding-bottom: 5rem;
  }
}
</style>

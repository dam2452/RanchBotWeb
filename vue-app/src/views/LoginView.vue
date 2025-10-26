<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LogoSection from '@/components/LogoSection.vue'
import LoginForm from '@/components/LoginForm.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import AppFooter from '@/components/AppFooter.vue'

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
  <AppFooter />

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
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: calc(100dvh - 70px);
  box-sizing: border-box;
  padding: 2.5rem;
  gap: 3rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 50%;
  box-sizing: border-box;
}

@media (max-width: 850px) {
  .login-page {
    height: auto;
    flex-direction: column;
    padding-top: 2rem;
    padding-bottom: 3rem;
    gap: 0.1rem;
    justify-content: flex-start;
  }

  .login-section {
    max-width: 100%;
    width: 100%;
  }
}

@media (max-width: 600px) {
  .login-page {
    padding-top: 1.5rem;
    gap: 0.1rem;
  }
}
</style>

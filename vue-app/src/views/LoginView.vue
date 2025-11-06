<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LogoSection from '@/components/LogoSection.vue'
import LoginForm from '@/components/LoginForm.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const authStore = useAuthStore()
const errorMessage = ref('')
const windowWidth = ref(window.innerWidth)

const isWatchView = computed(() => windowWidth.value <= 196)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

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
  <AppFooter v-if="!isWatchView" />

  <main class="login-page">
    <LogoSection v-if="!isWatchView" />

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
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  min-height: calc(100vh - 70px);
  box-sizing: border-box;
  padding: 24px 16px 24px;
  gap: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex: 0 0 auto;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  gap: 0;
}

@media (min-width: 481px) {
  .login-page {
    padding: 32px 24px 32px;
    gap: 0;
  }
}

@media (min-width: 851px) {
  .login-page {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 40px;
    gap: 48px;
  }

  .login-section {
    flex: 1;
    max-width: 50%;
    justify-content: center;
  }
}
</style>

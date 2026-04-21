<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWindowWidth } from '@/composables/useWindowWidth'
import LogoSection from '@/components/layout/LogoSection.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import ActionButtons from '@/components/common/ActionButtons.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const router = useRouter()
const authStore = useAuthStore()
const { windowWidth } = useWindowWidth()

const isWatchView = computed(() => windowWidth.value <= 196)
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

<style scoped lang="scss">
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

  @include mobile {
    padding: 32px 24px 32px;
    gap: 0;
  }

  @include tablet {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 40px;
    gap: 48px;
  }
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

  @include tablet {
    flex: 1;
    max-width: 50%;
    justify-content: center;
  }
}
</style>

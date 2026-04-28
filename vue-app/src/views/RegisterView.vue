<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppFooter from '@/components/layout/AppFooter.vue'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const fullName = ref('')
const localError = ref('')

const handleSubmit = async () => {
  localError.value = ''

  if (password.value !== confirmPassword.value) {
    localError.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 8) {
    localError.value = 'Password must be at least 8 characters'
    return
  }

  const success = await authStore.register({
    username: username.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
    full_name: fullName.value || undefined,
  })

  if (success) {
    router.push('/search')
  } else {
    localError.value = authStore.error || 'Registration failed'
  }
}
</script>

<template>
  <AppFooter />

  <main class="register-page">
    <div class="register-card">
      <h1 class="register-title">Create Account</h1>

      <form class="register-form" @submit.prevent="handleSubmit" novalidate>
        <div v-if="localError" class="form-error">{{ localError }}</div>

        <input
          v-model="username"
          type="text"
          placeholder="Username"
          autocomplete="username"
          required
          class="form-input"
        />

        <input
          v-model="fullName"
          type="text"
          placeholder="Full name (optional)"
          autocomplete="name"
          class="form-input"
        />

        <input
          v-model="password"
          type="password"
          placeholder="Password (min. 8 characters)"
          autocomplete="new-password"
          required
          class="form-input"
        />

        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Confirm password"
          autocomplete="new-password"
          required
          class="form-input"
        />

        <button type="submit" :disabled="authStore.loading" class="form-button">
          {{ authStore.loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <div class="form-footer">
        <span>Already have an account?</span>
        <router-link to="/login" class="form-link">Log in</router-link>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.register-card {
  background: #dcae75;
  border-radius: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 48px 40px 52px;
  max-width: 480px;
  width: 100%;
  border: 3px solid #aa9169;
  text-align: center;

  @include mobile {
    padding: 56px 48px 60px;
  }
}

.register-title {
  font-size: clamp(28px, 5vw, 36px);
  font-weight: bold;
  color: #8b4513;
  margin: 0 0 32px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.form-error {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: 10px;
  padding: 10px 14px;
  color: #d63031;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: #fdda9f;
  color: #8b4513;
  font-size: 15px;
  text-align: center;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
  transition: all 0.2s;

  &::placeholder {
    color: #a0522d;
    opacity: 0.8;
  }

  &:focus {
    outline: 2px solid #c58b4f;
    background: #ffe0a3;
  }
}

.form-button {
  width: 100%;
  padding: 13px;
  border: 2px solid #aa9169;
  border-radius: 14px;
  background: linear-gradient(to right, #fdd99d, #dcae75);
  color: #8b4513;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
  transition: all 0.2s;
  margin-top: 4px;

  &:hover:not(:disabled) {
    transform: scale(1.03);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #5a3417;
  font-size: 15px;
  font-weight: 500;
}

.form-link {
  color: #8b4513;
  font-weight: bold;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: #6b3410;
  }
}
</style>

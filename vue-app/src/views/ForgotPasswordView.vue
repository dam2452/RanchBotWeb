<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppFooter from '@/components/layout/AppFooter.vue'

const router = useRouter()
const authStore = useAuthStore()

const step = ref<1 | 2>(1)
const username = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const successMessage = ref('')
const localError = ref('')

const handleForgotPassword = async () => {
  if (!username.value.trim()) return
  localError.value = ''
  successMessage.value = ''

  const message = await authStore.forgotPassword(username.value.trim())
  if (message !== null) {
    successMessage.value = message || 'Reset code sent to your Telegram if the account exists.'
    step.value = 2
  } else {
    localError.value = authStore.error || 'Failed to send reset code'
  }
}

const handleResetPassword = async () => {
  localError.value = ''

  if (newPassword.value !== confirmPassword.value) {
    localError.value = 'Passwords do not match'
    return
  }

  if (newPassword.value.length < 8) {
    localError.value = 'Password must be at least 8 characters'
    return
  }

  const success = await authStore.resetPassword(username.value.trim(), code.value.trim(), newPassword.value)
  if (success) {
    router.push({ path: '/login', query: { message: 'Password reset successfully. Please log in.' } })
  } else {
    localError.value = authStore.error || 'Invalid or expired code'
  }
}

const goBack = () => {
  step.value = 1
  code.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  localError.value = ''
  successMessage.value = ''
}
</script>

<template>
  <AppFooter />

  <main class="forgot-page">
    <div class="forgot-card">
      <h1 class="forgot-title">
        {{ step === 1 ? 'Password Recovery' : 'Reset Password' }}
      </h1>

      <template v-if="step === 1">
        <p class="forgot-description">
          Enter your username and we will send a reset code to your linked Telegram account.
        </p>

        <form class="forgot-form" @submit.prevent="handleForgotPassword" novalidate>
          <div v-if="localError" class="form-error">{{ localError }}</div>

          <input
            v-model="username"
            type="text"
            placeholder="Username"
            autocomplete="username"
            required
            class="form-input"
          />

          <button type="submit" :disabled="authStore.loading" class="form-button">
            {{ authStore.loading ? 'Sending...' : 'Send Reset Code' }}
          </button>
        </form>
      </template>

      <template v-else>
        <div class="step-info">{{ successMessage }}</div>

        <form class="forgot-form" @submit.prevent="handleResetPassword" novalidate>
          <div v-if="localError" class="form-error">{{ localError }}</div>

          <input
            v-model="code"
            type="text"
            placeholder="6-digit code"
            maxlength="6"
            inputmode="numeric"
            pattern="[0-9]{6}"
            required
            class="form-input"
          />

          <input
            v-model="newPassword"
            type="password"
            placeholder="New password (min. 8 characters)"
            autocomplete="new-password"
            required
            class="form-input"
          />

          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            autocomplete="new-password"
            required
            class="form-input"
          />

          <button type="submit" :disabled="authStore.loading" class="form-button">
            {{ authStore.loading ? 'Resetting...' : 'Reset Password' }}
          </button>

          <button type="button" class="form-button-secondary" @click="goBack">
            Back
          </button>
        </form>
      </template>

      <div class="form-footer">
        <span>Remember your password?</span>
        <router-link to="/login" class="form-link">Log in</router-link>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.forgot-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.forgot-card {
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

.forgot-title {
  font-size: clamp(24px, 4.5vw, 32px);
  font-weight: bold;
  color: #8b4513;
  margin: 0 0 20px;
}

.forgot-description {
  color: #5a3417;
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 28px;
  line-height: 1.5;
}

.step-info {
  background: #fdda9f;
  border: 2px solid #c58b4f;
  border-radius: 12px;
  padding: 12px 16px;
  color: #5a3417;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  line-height: 1.5;
}

.forgot-form {
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

.form-button-secondary {
  width: 100%;
  padding: 11px;
  border: 2px solid #aa9169;
  border-radius: 14px;
  background: transparent;
  color: #8b4513;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
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

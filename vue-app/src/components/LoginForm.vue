<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  loading?: boolean
  error?: string
}

interface Emits {
  (e: 'submit', data: { login: string; password: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const login = ref('')
const password = ref('')

const handleSubmit = () => {
  emit('submit', {
    login: login.value,
    password: password.value
  })
}
</script>

<template>
  <div class="bench-wrapper">
    <div class="bench-container" style="position: relative; aspect-ratio: 1/1;">
      <img
        src="/images/others/bench.svg"
        alt="Bench Graphic"
        class="w-full h-auto block"
      />

    <form class="form-overlay" @submit.prevent="handleSubmit">
      <!-- Error Message -->
      <div
        v-if="error"
        class="error-message"
      >
        {{ error }}
      </div>

      <!-- Login Input -->
      <input
        v-model="login"
        type="text"
        name="login"
        placeholder="login"
        required
        autofocus
        class="form-input login-input"
      />

      <!-- Password Input -->
      <input
        v-model="password"
        type="password"
        name="password"
        placeholder="password"
        required
        class="form-input password-input"
      />

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="loading"
        class="form-button"
      >
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    </div>
  </div>
</template>

<style scoped>
.bench-wrapper {
  width: 100%;
  max-width: 100%;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

.bench-container {
  width: clamp(416px, 42vw, 754px);
  max-width: 100%;
}

@media (max-width: 1200px) {
  .bench-container {
    width: clamp(390px, 52vw, 650px);
  }
}

@media (max-width: 850px) {
  .bench-container {
    width: clamp(320px, 65vw, 480px);
  }
}

@media (max-width: 600px) {
  .bench-container {
    width: clamp(266px, 98vw, 363px);
  }
}

.form-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.error-message {
  position: absolute;
  top: 10%;
  left: 10%;
  width: 80%;
  padding: 0.5rem;
  background-color: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  color: #d63031;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.form-input {
  position: absolute;
  left: 15%;
  width: 70%;
  height: 8%;
  border: none;
  border-radius: 8px;
  text-align: center;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.3);
  background-color: #fdda9f;
  color: #8B4513;
  font-size: clamp(14px, 1.2vw, 18px);
}

.form-input::placeholder {
  color: #A0522D;
  opacity: 0.8;
}

.form-input:focus {
  outline: 2px solid #c58b4f;
  background-color: #ffe0a3;
}

.login-input {
  top: 23.5%;
}

.password-input {
  top: 37.6%;
}

.form-button {
  position: absolute;
  top: 53%;
  left: 0;
  width: 100%;
  height: 5.5%;
  font-weight: bold;
  font-size: clamp(14px, 1.2vw, 18px);
  border: 2px solid #aa9169;
  border-radius: 10px;
  cursor: pointer;
  background: linear-gradient(to right, #fdd99d, #dcae75);
  color: #8B4513;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.form-button:hover:not(:disabled) {
  transform: scale(1.04);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.form-button:active:not(:disabled) {
  transform: scale(0.96);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.form-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

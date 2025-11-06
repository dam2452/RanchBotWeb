<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FormInput from './FormInput.vue'
import ErrorMessage from './ErrorMessage.vue'
import PrimaryButton from './PrimaryButton.vue'

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

const handleSubmit = () => {
  emit('submit', {
    login: login.value,
    password: password.value
  })
}
</script>

<template>
  <div v-if="isWatchView" class="watch-form">
    <form class="simple-form" @submit.prevent="handleSubmit">
      <ErrorMessage :message="error" />
      <FormInput
        v-model="login"
        type="text"
        name="login"
        placeholder="login"
        required
        autofocus
      />
      <FormInput
        v-model="password"
        type="password"
        name="password"
        placeholder="password"
        required
      />
      <PrimaryButton
        size="small"
        :disabled="loading"
        @click="handleSubmit"
      >
        {{ loading ? 'Logging in...' : 'Login' }}
      </PrimaryButton>
    </form>
  </div>

  <div v-else class="bench-wrapper">
    <div class="bench-container">
      <img
        src="/images/others/bench.svg"
        alt="Bench Graphic"
        class="bench-image"
      />

      <form class="form-overlay" @submit.prevent="handleSubmit">
        <div v-if="error" class="error-overlay">
          {{ error }}
        </div>

        <input
          v-model="login"
          type="text"
          name="login"
          placeholder="login"
          required
          autofocus
          class="overlay-input login-input"
        />

        <input
          v-model="password"
          type="password"
          name="password"
          placeholder="password"
          required
          class="overlay-input password-input"
        />

        <button
          type="submit"
          :disabled="loading"
          class="overlay-button"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.watch-form {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-sm);
  box-sizing: border-box;
}

.simple-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 180px;
}

.bench-wrapper {
  width: 100%;
  max-width: 100%;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  margin-bottom: 0;
}

.bench-container {
  width: clamp(266px, 98vw, 363px);
  max-width: 100%;
  position: relative;
  aspect-ratio: 1/1;
}

.bench-image {
  width: 100%;
  height: auto;
  display: block;
}

.form-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.error-overlay {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
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

.overlay-input {
  position: absolute;
  left: 17.5%;
  width: 65%;
  height: 7%;
  border: none;
  border-radius: 8px;
  text-align: center;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.3);
  background-color: #fdda9f;
  color: #8B4513;
  font-size: 14px;
  padding: 0 4px;
  transition: all var(--transition-default);
}

.overlay-input::placeholder {
  color: #A0522D;
  opacity: 0.8;
}

.overlay-input:focus {
  outline: 2px solid #c58b4f;
  background-color: #ffe0a3;
}

.login-input {
  top: 23.5%;
}

.password-input {
  top: 37.6%;
}

.overlay-button {
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
  transition: all var(--transition-default);
}

.overlay-button:hover:not(:disabled) {
  transform: scale(1.04);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.overlay-button:active:not(:disabled) {
  transform: scale(0.96);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.overlay-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (min-width: 481px) {
  .bench-container {
    width: clamp(320px, 65vw, 480px);
  }

  .overlay-input {
    left: 15%;
    width: 70%;
    height: 8%;
    font-size: 16px;
  }
}

@media (min-width: 851px) {
  .bench-container {
    width: clamp(390px, 52vw, 650px);
  }

  .overlay-input {
    font-size: clamp(16px, 1.2vw, 18px);
  }
}

@media (min-width: 1201px) {
  .bench-container {
    width: clamp(416px, 42vw, 754px);
  }
}
</style>

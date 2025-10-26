<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToRegister = () => {
  router.push('/register')
}

const goToForgotPassword = () => {
  router.push('/forgot-password')
}
</script>

<template>
  <div class="action-buttons">
    <button @click="goToRegister" class="action-button">
      Create account ?
    </button>

    <button @click="goToForgotPassword" class="action-button">
      Forgot password ?
    </button>
  </div>
</template>

<style scoped>
.action-buttons {
  margin-top: 0.3rem;
  display: flex;
  gap: 1.25rem;
  width: 100%;
  max-width: 100%;
  justify-content: center;
  box-sizing: border-box;
}

.action-button {
  padding: clamp(1rem, 1.5vw, 1.6rem);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  flex-grow: 1;
  max-width: clamp(260px, 30vw, 360px);
  font-size: clamp(20px, 1.5vw, 28px);
  background: linear-gradient(to bottom right, #4CAF50, #45a049);
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.action-button:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.action-button:active {
  transform: scale(0.97);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@media (max-width: 1100px) and (min-width: 850px) {
  .action-button {
    max-width: clamp(220px, 40vw, 300px);
    font-size: clamp(18px, 2vw, 24px);
    padding: clamp(0.8rem, 1.3vw, 1.3rem);
  }
}

@media (max-width: 849px) {
  .action-buttons {
    flex-direction: column;
    gap: 0.9375rem;
    width: 100%;
    margin-top: 0.3rem;
  }

  .action-button {
    flex-basis: 0;
    padding: clamp(1rem, 3vw, 1.17rem);
    font-size: clamp(26px, 4.7vw, 31px);
    min-width: 119px;
    max-width: none;
  }
}
</style>

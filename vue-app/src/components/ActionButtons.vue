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
  margin-top: 0.625rem;
  display: flex;
  gap: 1.25rem;
  width: 100%;
  justify-content: center;
}

.action-button {
  padding: 2.25rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  flex-grow: 1;
  max-width: 520px;
  font-size: clamp(44px, 1.7vw, 46px);
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

@media (max-width: 849px) {
  .action-buttons {
    flex-direction: column;
    gap: 0.9375rem;
    width: 80%;
    margin-top: 1.25rem;
  }

  .action-button {
    flex-basis: 0;
    padding: 1.375rem;
    font-size: clamp(30px, 5.5vw, 37px);
    min-width: 140px;
    max-width: none;
  }
}
</style>

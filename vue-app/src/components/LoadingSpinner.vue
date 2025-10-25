<script setup lang="ts">
interface Props {
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Loading...'
})
</script>

<template>
  <div class="loading-container">
    <div class="spinner"></div>
    <p class="message">{{ message }}</p>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.spinner {
  width: 120px;
  height: 120px;
  border: 12px solid rgba(200, 200, 200, 0.3);
  border-top-color: #f2a94c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}
</style>

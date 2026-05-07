<script setup lang="ts">
interface Props {
  message?: string
  size?: 'small' | 'medium' | 'large'
  showMessage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Loading...',
  size: 'large',
  showMessage: true
})

const spinnerSizes = {
  small: { width: '60px', border: '6px' },
  medium: { width: '80px', border: '8px' },
  large: { width: '120px', border: '12px' }
}

const messageSizes = {
  small: '1rem',
  medium: '1.5rem',
  large: '2rem'
}
</script>

<template>
  <div class="loading-container" :class="{ 'inline': !showMessage }">
    <div
      class="spinner"
      :style="{
        width: spinnerSizes[size].width,
        height: spinnerSizes[size].width,
        borderWidth: spinnerSizes[size].border
      }"
    ></div>
    <p v-if="showMessage" class="message" :style="{ fontSize: messageSizes[size] }">{{ message }}</p>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-container.inline {
  display: inline-flex;
}

.spinner {
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
  font-weight: bold;
  color: white;
}
</style>

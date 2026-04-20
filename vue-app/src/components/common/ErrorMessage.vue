<script setup lang="ts">
interface Props {
  message?: string
}

defineProps<Props>()
</script>

<template>
  <div v-if="message" class="error-message">
    {{ message }}
  </div>
</template>

<style scoped>
.error-message {
  width: 100%;
  padding: 12px;
  background-color: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  color: #d63031;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  box-sizing: border-box;
  margin-bottom: 12px;
}
</style>

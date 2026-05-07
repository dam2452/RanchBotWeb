<script setup lang="ts">
import BaseModal from './BaseModal.vue'

interface Props {
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm'): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel'
})

const emit = defineEmits<Emits>()
</script>

<template>
  <BaseModal :show="show" :title="title" @close="emit('close')">
    <p class="message">{{ message }}</p>

    <template #footer>
      <button class="cancel-btn" @click="emit('close')">{{ cancelText }}</button>
      <button class="confirm-btn" @click="emit('confirm')">{{ confirmText }}</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.message {
  color: #333;
  font-size: 1.05rem;
  line-height: 1.5;
  margin: 0;
  text-align: center;
  font-weight: 500;
}

.cancel-btn,
.confirm-btn {
  padding: 0.625rem 1.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #e0e0e0;
  color: #333;
}

.cancel-btn:hover {
  background: #d0d0d0;
}

.confirm-btn {
  background: #d9534f;
  color: white;
}

.confirm-btn:hover {
  background: #c9302c;
}
</style>

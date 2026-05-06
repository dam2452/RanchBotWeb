<script setup lang="ts">
import type { ToastType } from '@/composables/useToast'

interface Props {
  message: string
  type?: ToastType
  visible: boolean
}

defineProps<Props>()
</script>

<template>
  <Transition name="toast-fade">
    <div
      v-if="visible && message"
      class="status-toast"
      :class="`status-toast--${type ?? 'info'}`"
      role="status"
      aria-live="polite"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.status-toast {
  position: absolute;
  bottom: 28%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  z-index: 1100;
  pointer-events: none;
  white-space: normal;
  word-break: break-word;
  max-width: min(90%, 360px);
  width: max-content;
  text-align: center;
}

.status-toast--info {
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
}

.status-toast--success {
  background: rgba(60, 160, 70, 0.9);
  color: #fff;
}

.status-toast--error {
  background: rgba(200, 50, 50, 0.9);
  color: #fff;
}

.status-toast--warning {
  background: rgba(210, 140, 20, 0.92);
  color: #fff;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
interface Props {
  show: boolean
  title: string
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const _handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="modal-overlay"
        @click.self="emit('close')"
        @keydown="_handleKeydown"
      >
        <div class="modal-container">
          <div class="modal-header">
            <h2>{{ title }}</h2>
            <button @click="emit('close')" class="close-btn" aria-label="Close">×</button>
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
}

.modal-container {
  background: #f0f0f0;
  border-radius: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  border: 2px solid #f2a94c;
  width: 95%;
  max-width: 500px;
  overflow: hidden;

  @media (min-width: 601px) {
    width: 90%;
    max-width: 450px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f8f8;

  h2 {
    margin: 0;
    color: #333;
    font-size: 1.5rem;
    font-weight: 600;
  }

  @media (min-width: 601px) {
    padding: 1.25rem 1.75rem;
  }
}

.close-btn {
  background: #e0e0e0;
  border: none;
  font-size: 1.5rem;
  color: #333;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  padding: 0;
  line-height: 1;

  &:hover {
    background: #d0d0d0;
  }
}

.modal-body {
  padding: 1.5rem;

  @media (min-width: 601px) {
    padding: 1.75rem;
  }
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
  background: #f8f8f8;

  @media (min-width: 601px) {
    padding: 1.25rem 1.75rem;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.2s;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.9);
}
</style>

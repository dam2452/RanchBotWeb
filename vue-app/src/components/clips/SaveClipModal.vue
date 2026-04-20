<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  show: boolean
  initialName?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'save', clipName: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const clipName = ref('')

watch(() => props.show, (newShow) => {
  if (newShow) {
    clipName.value = props.initialName || ''
  }
})

const handleSave = () => {
  if (clipName.value.trim()) {
    emit('save', clipName.value.trim())
  }
}

const handleClose = () => {
  emit('close')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleSave()
  } else if (event.key === 'Escape') {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="modal-overlay"
        @click.self="handleClose"
      >
        <div class="modal-container">
          <div class="modal-header">
            <h2>Save Clip</h2>
            <button @click="handleClose" class="close-btn" aria-label="Close">×</button>
          </div>

          <div class="modal-body">
            <label for="clip-name" class="input-label">Clip Name:</label>
            <input
              id="clip-name"
              v-model="clipName"
              type="text"
              class="clip-input"
              placeholder="Enter clip name..."
              autofocus
              @keydown="handleKeydown"
            />
          </div>

          <div class="modal-footer">
            <button @click="handleClose" class="cancel-btn">Cancel</button>
            <button @click="handleSave" class="save-btn" :disabled="!clipName.trim()">Save</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  min-width: 100vw;
  min-height: 100vh;
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
  border-top: 2px solid #f2a94c;
  width: 95%;
  max-width: 500px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f8f8;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
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
}

.close-btn:hover {
  background: #d0d0d0;
}

.modal-body {
  padding: 1.5rem;
}

.input-label {
  display: block;
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.65rem;
}

.clip-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  color: #333;
  box-sizing: border-box;
  transition: all var(--transition-default);
}

.clip-input:focus {
  outline: none;
  border-color: #f2a94c;
  box-shadow: 0 0 0 3px rgba(242, 169, 76, 0.2);
}

.clip-input::placeholder {
  color: #999;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
  background: #f8f8f8;
}

.cancel-btn,
.save-btn {
  padding: 0.625rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-default);
}

.cancel-btn {
  background: #e0e0e0;
  color: #333;
}

.cancel-btn:hover {
  background: #d0d0d0;
}

.save-btn {
  background: #4CAF50;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #45a049;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

@media (min-width: 601px) {
  .modal-container {
    width: 90%;
  }

  .modal-header {
    padding: 1.25rem 1.75rem;
  }

  .modal-body {
    padding: 1.75rem;
  }

  .modal-footer {
    padding: 1.25rem 1.75rem;
  }

  .cancel-btn,
  .save-btn {
    padding: 0.625rem 1.75rem;
    font-size: 0.95rem;
  }

  .clip-input {
    font-size: 1rem;
  }
}
</style>

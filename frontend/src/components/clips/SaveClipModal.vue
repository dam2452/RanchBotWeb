<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '../common/BaseModal.vue'

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
  if (newShow) clipName.value = props.initialName || ''
})

const handleSave = () => {
  if (clipName.value.trim()) emit('save', clipName.value.trim())
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') handleSave()
}
</script>

<template>
  <BaseModal :show="show" title="Save Clip" @close="emit('close')">
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

    <template #footer>
      <button class="cancel-btn" @click="emit('close')">Cancel</button>
      <button class="save-btn" :disabled="!clipName.trim()" @click="handleSave">Save</button>
    </template>
  </BaseModal>
</template>

<style scoped>
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
  transition: border-color 0.2s, box-shadow 0.2s;
}

.clip-input:focus {
  outline: none;
  border-color: #f2a94c;
  box-shadow: 0 0 0 3px rgba(242, 169, 76, 0.2);
}

.clip-input::placeholder {
  color: #999;
}

.cancel-btn,
.save-btn {
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
</style>

<template>
  <MenuPopup v-model="show" title="Activate Key">
    <div class="popup-row">
      <input
        v-model="keyInput"
        type="text"
        placeholder="Enter key..."
        class="popup-input"
        @keyup.enter="handleRedeem"
      />
      <button
        class="popup-go-btn"
        :disabled="loading || !keyInput.trim()"
        @click="handleRedeem"
      >
        {{ loading ? '...' : 'Go' }}
      </button>
    </div>
    <p v-if="error" class="popup-msg popup-msg--error">{{ error }}</p>
    <p v-if="success" class="popup-msg popup-msg--success">{{ success }}</p>
  </MenuPopup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MenuPopup from './MenuPopup.vue'

defineProps<{
  loading: boolean
  error: string
  success: string
}>()

const emit = defineEmits<{
  (e: 'redeem', key: string): void
}>()

const show = defineModel<boolean>({ default: false })
const keyInput = ref('')

const handleRedeem = () => {
  if (!keyInput.value.trim()) return
  emit('redeem', keyInput.value.trim())
  keyInput.value = ''
}
</script>

<style scoped lang="scss">
.popup-row {
  display: flex;
  gap: 8px;
}

.popup-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #c58b4f;
  border-radius: 10px;
  background: #fdda9f;
  color: #8b4513;
  font-size: 14px;

  &::placeholder { color: #a0522d; opacity: 0.7; }
  &:focus { outline: none; border-color: #e09340; background: #ffe0a3; }
}

.popup-go-btn {
  padding: 10px 18px;
  border: 2px solid #3a7a3a;
  border-radius: 10px;
  background: linear-gradient(135deg, #5ba85b, #4a974a);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
  white-space: nowrap;

  &:hover { transform: scale(1.04); }
  &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
}

.popup-msg {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.popup-msg--error { color: #c0392b; }
.popup-msg--success { color: #2e7d32; }
</style>

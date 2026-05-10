<template>
  <MenuPopup v-model="show" title="Change Password">
    <input
      v-model="oldPassword"
      type="password"
      placeholder="Current password"
      class="popup-input"
    />
    <input
      v-model="newPassword"
      type="password"
      placeholder="New password"
      class="popup-input"
    />
    <button
      class="popup-submit-btn"
      :disabled="loading || !oldPassword || !newPassword"
      @click="handleChange"
    >
      {{ loading ? 'Changing...' : 'Change Password' }}
    </button>
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
  (e: 'change', oldPw: string, newPw: string): void
}>()

const show = defineModel<boolean>({ default: false })
const oldPassword = ref('')
const newPassword = ref('')

const handleChange = () => {
  if (!oldPassword.value || !newPassword.value) return
  emit('change', oldPassword.value, newPassword.value)
  oldPassword.value = ''
  newPassword.value = ''
}
</script>

<style scoped lang="scss">
.popup-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #c58b4f;
  border-radius: 10px;
  background: #fdda9f;
  color: #8b4513;
  font-size: 14px;
  box-sizing: border-box;

  &::placeholder { color: #a0522d; opacity: 0.7; }
  &:focus { outline: none; border-color: #e09340; background: #ffe0a3; }
}

.popup-submit-btn {
  width: 100%;
  padding: 11px;
  border: 2px solid #aa9169;
  border-radius: 10px;
  background: linear-gradient(to right, #fdd99d, #dcae75);
  color: #8b4513;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);

  &:hover { transform: scale(1.02); box-shadow: 0 5px 12px rgba(0, 0, 0, 0.22); }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
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

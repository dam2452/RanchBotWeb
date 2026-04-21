<script setup lang="ts">
import { ref } from 'vue'
import FormInput from '../common/FormInput.vue'
import ErrorMessage from '../common/ErrorMessage.vue'
import PrimaryButton from '../common/PrimaryButton.vue'

interface Props {
  loading?: boolean
  error?: string
}

interface Emits {
  (e: 'submit', data: { login: string; password: string }): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const login = ref('')
const password = ref('')

const handleSubmit = () => {
  emit('submit', { login: login.value, password: password.value })
}
</script>

<template>
  <form class="watch-form" @submit.prevent="handleSubmit">
    <ErrorMessage :message="error" />
    <FormInput
      v-model="login"
      type="text"
      name="login"
      placeholder="login"
      required
      autofocus
    />
    <FormInput
      v-model="password"
      type="password"
      name="password"
      placeholder="password"
      required
    />
    <PrimaryButton
      size="small"
      :disabled="loading"
      @click="handleSubmit"
    >
      {{ loading ? 'Logging in...' : 'Login' }}
    </PrimaryButton>
  </form>
</template>

<style scoped lang="scss">
.watch-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 180px;
}
</style>

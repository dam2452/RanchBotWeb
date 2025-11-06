<script setup lang="ts">
interface Props {
  modelValue: string
  type?: 'text' | 'password' | 'email'
  placeholder?: string
  required?: boolean
  autofocus?: boolean
  name?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  autofocus: false
})

const emit = defineEmits<Emits>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    :type="type"
    :name="name"
    :value="modelValue"
    :placeholder="placeholder"
    :required="required"
    :autofocus="autofocus"
    class="form-input"
    @input="handleInput"
  />
</template>

<style scoped>
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  text-align: center;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.3);
  background-color: #fdda9f;
  color: #8B4513;
  font-size: 16px;
  box-sizing: border-box;
  transition: all var(--transition-default);
}

@media (min-width: 481px) {
  .form-input {
    font-size: clamp(16px, 1.2vw, 18px);
  }
}

.form-input::placeholder {
  color: #A0522D;
  opacity: 0.8;
}

.form-input:focus {
  outline: 2px solid #c58b4f;
  background-color: #ffe0a3;
}
</style>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="popup-overlay" @click.self="$emit('update:modelValue', false)">
        <div class="popup-card">
          <div class="popup-title">{{ title }}</div>
          <slot />
          <button class="popup-close-btn" @click="$emit('update:modelValue', false)">Close</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  title: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>

<style scoped lang="scss">
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.popup-card {
  background: #dcae75;
  border: 3px solid #aa9169;
  border-radius: 24px;
  padding: 28px 32px;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.popup-title {
  color: #5a3417;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.popup-close-btn {
  padding: 10px 32px;
  border: 2px solid #aa9169;
  border-radius: 12px;
  background: linear-gradient(to right, #fdd99d, #dcae75);
  color: #8b4513;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  align-self: center;

  &:hover { transform: scale(1.04); box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25); }
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>

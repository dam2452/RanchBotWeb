<template>
  <Transition name="banner">
    <div v-if="visible" class="install-banner">
      <span class="install-text">Add RanchBot to Home Screen</span>
      <button class="install-btn" @click="handleInstall">Install</button>
      <button class="install-close" @click="handleDismiss" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePWAInstall } from '@/composables/usePWAInstall'

const { canInstall, install, dismiss } = usePWAInstall()
const visible = ref(false)

onMounted(() => {
  setTimeout(() => {
    if (canInstall.value) visible.value = true
  }, 1500)
})

const handleInstall = async () => {
  const accepted = await install()
  if (accepted) visible.value = false
}

const handleDismiss = () => {
  dismiss()
  visible.value = false
}
</script>

<style scoped lang="scss">
.install-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 16px;
  padding-top: calc(10px + env(safe-area-inset-top));
  background: linear-gradient(to right, #1aa899, #178f7f);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
}

.install-text {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.install-btn {
  padding: 6px 18px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(to right, #fdd99d, #dcae75);
  color: #5a3417;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.15s;

  &:active { transform: scale(0.95); }
}

.install-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;

  svg { width: 14px; height: 14px; }
  &:active { background: rgba(255, 255, 255, 0.3); }
}

.banner-enter-active,
.banner-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
}

.banner-enter-from,
.banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>

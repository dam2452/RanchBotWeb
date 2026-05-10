<template>
  <div class="menu-actions">
    <button
      v-if="showMyClips"
      class="action-btn action-btn--clips"
      @click="$emit('go-my-clips')"
    >
      My Clips
    </button>
    <button class="action-btn action-btn--key" @click="$emit('activate-key')">
      Activate Key
    </button>
    <button class="action-btn action-btn--password" @click="$emit('change-password')">
      Change Password
    </button>
    <button
      v-if="showLinkTelegram"
      class="action-btn action-btn--telegram"
      :disabled="telegramLoading"
      @click="$emit('link-telegram')"
    >
      {{ telegramLoading ? '...' : 'Link Telegram' }}
    </button>
    <button class="action-btn action-btn--logout" @click="$emit('logout')">
      Logout
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showMyClips: boolean
  showLinkTelegram: boolean
  telegramLoading: boolean
}>()

defineEmits<{
  (e: 'link-telegram'): void
  (e: 'go-my-clips'): void
  (e: 'logout'): void
  (e: 'activate-key'): void
  (e: 'change-password'): void
}>()
</script>

<style scoped lang="scss">
.menu-actions {
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  width: 100%;
  padding: 11px;
  border: 2px solid #aa9169;
  border-radius: 12px;
  background: linear-gradient(to right, #fdd99d, #dcae75);
  color: #8b4513;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);

  &:hover { transform: scale(1.02); box-shadow: 0 5px 14px rgba(0, 0, 0, 0.22); }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
}

.action-btn--clips {
  background: linear-gradient(135deg, #27ae60, #1e8449);
  border-color: #1e8449;
  color: #fff;

  &:hover { box-shadow: 0 5px 14px rgba(39, 174, 96, 0.4); }
}

.action-btn--key {
  background: linear-gradient(135deg, #8e44ad, #6c3483);
  border-color: #6c3483;
  color: #fff;

  &:hover { box-shadow: 0 5px 14px rgba(142, 68, 173, 0.4); }
}

.action-btn--password {
  background: linear-gradient(135deg, #e67e22, #d35400);
  border-color: #d35400;
  color: #fff;

  &:hover { box-shadow: 0 5px 14px rgba(230, 126, 34, 0.4); }
}

.action-btn--telegram {
  background: linear-gradient(135deg, #5b9bd5, #4a87c1);
  border-color: #4a87c1;
  color: #fff;

  &:hover { box-shadow: 0 5px 14px rgba(74, 135, 193, 0.4); }
}

.action-btn--logout {
  background: linear-gradient(135deg, #c0392b, #a93226);
  border-color: #a93226;
  color: #fff;

  &:hover { box-shadow: 0 5px 14px rgba(192, 57, 43, 0.4); }
}
</style>

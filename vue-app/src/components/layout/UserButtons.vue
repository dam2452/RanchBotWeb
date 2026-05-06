<template>
  <div
    class="auth-buttons-container flex items-stretch gap-[10px]"
    :class="{ 'fixed': fixed }"
  >
    <template v-if="authStore.isAuthenticated">
      <div class="tooltip-container relative inline-block">
        <button
          id="user-welcome-link"
          :title="showTooltip ? 'Click to check your subscription' : ''"
          :class="compact ? 'compact-user-btn' : 'user-btn'"
          :style="compact ? '' : 'background: linear-gradient(145deg, #f2a94c, #e09340); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);'"
          @click="handleTooltipClick"
        >
          <template v-if="compact">
            <img src="/images/ui/icons/user.svg" alt="" class="compact-icon" />
          </template>
          <template v-else>
            <span class="user-btn-full">Hi, {{ authStore.user?.username }}</span>
            <img src="/images/ui/icons/user.svg" alt="" class="user-btn-icon" />
          </template>
        </button>
        <SubscriptionTooltip
          ref="tooltipRef"
          :visible="tooltipVisible"
          @close="tooltipVisible = false"
        />
      </div>
      <button
        v-if="showMyClips"
        @click="$router.push('/my-clips')"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="btn-default clips-btn"
      >
        <span class="clips-btn-full">My Clips</span>
        <img src="/images/ui/icons/clips.svg" alt="" class="clips-btn-icon" />
      </button>
      <button
        v-if="authStore.user && authStore.user.id < 0"
        @click="handleLinkTelegram"
        :disabled="linkTelegramLoading"
        style="background: linear-gradient(145deg, #5b9bd5, #4a87c1); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="btn-default"
      >
        {{ linkTelegramLoading ? '...' : 'Link Telegram' }}
      </button>
      <button
        @click="handleLogout"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="btn-default logout-btn"
      >
        <span class="logout-btn-full">Logout</span>
        <img src="/images/ui/icons/logout.svg" alt="" class="logout-btn-icon" />
      </button>

      <div v-if="linkingCode" class="linking-overlay" @click.self="linkingCode = ''">
        <div class="linking-card">
          <p class="linking-instruction">Send this command to the Telegram bot:</p>
          <code class="linking-code">/link {{ linkingCode }}</code>
          <p class="linking-note">Valid for 30 minutes. After linking, log out and back in.</p>
          <button class="linking-close" @click="linkingCode = ''">Close</button>
        </div>
      </div>
    </template>
    <template v-else>
      <button
        @click="$router.push('/login')"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="btn-default"
      >
        Login
      </button>
      <button
        @click="$router.push('/register')"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="btn-default"
      >
        Register
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import SubscriptionTooltip from '../clips/SubscriptionTooltip.vue'

interface Props {
  fixed?: boolean
  showMyClips?: boolean
  showTooltip?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fixed: false,
  showMyClips: true,
  showTooltip: true,
  compact: false
})

const authStore = useAuthStore()
const router = useRouter()
const tooltipVisible = ref(false)
const tooltipRef = ref<InstanceType<typeof SubscriptionTooltip> | null>(null)
const linkingCode = ref('')
const linkTelegramLoading = ref(false)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const handleTooltipClick = async (e: Event) => {
  e.stopPropagation()

  if (tooltipVisible.value) {
    tooltipVisible.value = false
  } else {
    tooltipVisible.value = true
    await tooltipRef.value?.loadSubscription()
  }
}

const handleLinkTelegram = async () => {
  linkTelegramLoading.value = true
  try {
    const result = await authService.linkTelegram()
    linkingCode.value = result.linking_code
  } catch (err) {
    console.error('Link Telegram error:', err)
  } finally {
    linkTelegramLoading.value = false
  }
}

const handleOutsideClick = (e: Event) => {
  const target = e.target as HTMLElement
  const welcomeLink = document.getElementById('user-welcome-link')

  if (tooltipVisible.value && !target.closest('.subscription-tooltip') && target !== welcomeLink) {
    tooltipVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped lang="scss">
.auth-buttons-container.fixed {
  position: fixed !important;
  top: calc(1.25rem + env(safe-area-inset-top)) !important;
  right: calc(1.25rem + env(safe-area-inset-right)) !important;
  z-index: 10000 !important;

  @include tablet-down {
    top: calc(0.9375rem + env(safe-area-inset-top)) !important;
    right: calc(0.9375rem + env(safe-area-inset-right)) !important;
  }
}

.btn-default {
  border: none;
  border-radius: 15px;
  transition: all 0.2s;
  padding: 1vh 2.5vw;
  font-size: clamp(14px, 1.4vw, 16px);
  font-weight: bold;
  color: white;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  @include tablet-down {
    padding: 10px 20px;
    font-size: 14px;
  }
}

.user-btn {
  border: none;
  border-radius: 15px;
  transition: all 0.2s;
  padding: 1vh 2.5vw;
  font-size: clamp(14px, 1.4vw, 16px);
  font-weight: bold;
  color: white;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  @include tablet-down {
    padding: 10px 20px;
    font-size: 14px;
  }

  @include small-mobile {
    padding: 5px 15px;
  }
}

.user-btn-icon {
  display: none;
}

.user-btn-full {
  display: inline;
}

.logout-btn-icon,
.clips-btn-icon {
  display: none;
}

.logout-btn-full,
.clips-btn-full {
  display: inline;
}

@include tablet-down {
  .user-btn {
    aspect-ratio: 1;
    padding: 0 !important;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .user-btn-icon {
    display: block;
    width: 68%;
    height: 68%;
  }

  .user-btn-full {
    display: none;
  }

  .logout-btn {
    aspect-ratio: 1;
    padding: 0 !important;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logout-btn-icon {
    display: block;
    width: 26px;
    height: 26px;
    max-width: none;
    max-height: none;
  }

  .logout-btn-full {
    display: none;
  }

  .clips-btn {
    aspect-ratio: 1;
    padding: 0 !important;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clips-btn-icon {
    display: block;
    width: 26px;
    height: 26px;
    max-width: none;
    max-height: none;
  }

  .clips-btn-full {
    display: none;
  }

  .btn-default {
    height: 40px;
    padding: 0 14px !important;
    font-size: 13px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .compact-user-btn {
    width: 40px;
    height: 40px;
  }
}

.compact-user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: linear-gradient(145deg, #f2a94c, #e09340);
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.compact-icon {
  width: 68%;
  height: 68%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.linking-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.linking-card {
  background: #dcae75;
  border: 3px solid #aa9169;
  border-radius: 24px;
  padding: 32px 36px;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.linking-instruction {
  color: #5a3417;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px;
}

.linking-code {
  display: block;
  background: #fdda9f;
  border: 2px solid #c58b4f;
  border-radius: 12px;
  padding: 14px 20px;
  color: #8b4513;
  font-size: 18px;
  font-weight: bold;
  font-family: monospace;
  margin-bottom: 16px;
  word-break: break-all;
}

.linking-note {
  color: #5a3417;
  font-size: 13px;
  margin: 0 0 20px;
  line-height: 1.5;
}

.linking-close {
  padding: 10px 32px;
  border: 2px solid #aa9169;
  border-radius: 12px;
  background: linear-gradient(to right, #fdd99d, #dcae75);
  color: #8b4513;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.04);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
  }
}
</style>

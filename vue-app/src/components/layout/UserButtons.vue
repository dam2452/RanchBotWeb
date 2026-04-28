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
          :class="compact ? 'compact-user-btn' : 'border-none rounded-[15px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]'"
          :style="compact ? '' : 'background: linear-gradient(145deg, #f2a94c, #e09340); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);'"
          @click="handleTooltipClick"
        >
          <img v-if="compact" src="/images/ui/icons/wine-bottle.svg" alt="" class="compact-icon" />
          <span v-else>Hi, {{ authStore.user?.username }}</span>
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
        class="border-none rounded-[15px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        My Clips
      </button>
      <button
        v-if="authStore.user && authStore.user.id < 0"
        @click="handleLinkTelegram"
        :disabled="linkTelegramLoading"
        style="background: linear-gradient(145deg, #5b9bd5, #4a87c1); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="border-none rounded-[15px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        {{ linkTelegramLoading ? '...' : 'Link Telegram' }}
      </button>
      <button
        @click="handleLogout"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="border-none rounded-[15px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        Logout
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
        class="border-none rounded-[15px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        Login
      </button>
      <button
        @click="$router.push('/register')"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="border-none rounded-[15px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
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
  top: calc(20px + env(safe-area-inset-top)) !important;
  right: calc(20px + env(safe-area-inset-right)) !important;
  z-index: 10000 !important;

  @include tablet-down {
    top: calc(15px + env(safe-area-inset-top)) !important;
    right: calc(15px + env(safe-area-inset-right)) !important;
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
  width: 55%;
  height: 55%;
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

<template>
  <div
    class="auth-buttons-container flex gap-[10px]"
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
        @click="handleLogout"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="border-none rounded-[15px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        Logout
      </button>
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
  width: clamp(36px, 5vw, 44px);
  height: clamp(36px, 5vw, 44px);
  padding: 0;
  border: none;
  border-radius: 50%;
  background: linear-gradient(145deg, #f2a94c, #e09340);
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  cursor: pointer;

  @media (max-width: 400px) {
    width: 32px;
    height: 32px;
  }
}

.compact-icon {
  width: 60%;
  height: 60%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
</style>


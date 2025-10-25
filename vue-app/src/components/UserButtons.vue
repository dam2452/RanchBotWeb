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
          style="background: linear-gradient(145deg, #f2a94c, #e09340); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
          class="border-none rounded-[15px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
          @click="handleTooltipClick"
        >
          Hi, {{ authStore.user?.username }}
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
import SubscriptionTooltip from './SubscriptionTooltip.vue'

interface Props {
  fixed?: boolean
  showMyClips?: boolean
  showTooltip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fixed: false,
  showMyClips: true,
  showTooltip: true
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

<style scoped>
.auth-buttons-container.fixed {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  z-index: 1000 !important;
}

@media (max-width: 850px) {
  .auth-buttons-container.fixed {
    top: 15px !important;
    right: 15px !important;
  }
}
</style>


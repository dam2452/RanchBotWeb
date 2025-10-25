<template>
  <div
    class="auth-buttons-container flex gap-[10px]"
    :class="{ 'fixed': fixed }"
  >
    <template v-if="authStore.isAuthenticated">
      <button
        id="user-welcome-link"
        :title="showTooltip ? 'Click to check your subscription' : ''"
        style="background: linear-gradient(145deg, #f2a94c, #e09340); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="border-none rounded-[25px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        Hi, {{ authStore.user?.username }}
      </button>
      <button
        v-if="showMyClips"
        @click="$router.push('/my-clips')"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="border-none rounded-[25px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        My Clips
      </button>
      <button
        @click="handleLogout"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="border-none rounded-[25px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        Logout
      </button>
    </template>
    <template v-else>
      <button
        @click="$router.push('/login')"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="border-none rounded-[25px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        Login
      </button>
      <button
        @click="$router.push('/register')"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="border-none rounded-[25px] transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-hover active:shadow-active p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold max-[850px]:!p-[10px_20px] max-[850px]:!text-sm max-[400px]:!p-[5px_15px]"
      >
        Register
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

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

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
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


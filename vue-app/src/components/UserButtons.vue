<template>
  <div
    class="flex gap-2.5 z-1000"
    :class="fixed ? 'fixed top-5 right-5' : ''"
  >
    <template v-if="authStore.isAuthenticated">
      <button
        id="user-welcome-link"
        :title="showTooltip ? 'Click to check your subscription' : ''"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-action p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold"
      >
        Hi, {{ authStore.user?.username }}
      </button>
      <button
        v-if="showMyClips"
        @click="$router.push('/my-clips')"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-auth-btn p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold"
      >
        My Clips
      </button>
      <button
        @click="handleLogout"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-auth-btn p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold"
      >
        Logout
      </button>
    </template>
    <template v-else>
      <button
        @click="$router.push('/login')"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-auth-btn p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold"
      >
        Login
      </button>
      <button
        @click="$router.push('/register')"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-auth-btn p-[1vh_2.5vw] text-[clamp(14px,1.4vw,16px)] font-bold"
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


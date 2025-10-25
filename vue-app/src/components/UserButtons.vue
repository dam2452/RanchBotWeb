<template>
  <div
    class="flex z-[1000]"
    :class="fixed ? 'fixed' : ''"
    :style="fixed ? 'top: 20px; right: 20px; gap: 10px;' : 'gap: 10px;'"
  >
    <template v-if="authStore.isAuthenticated">
      <button
        id="user-welcome-link"
        :title="showTooltip ? 'Click to check your subscription' : ''"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-to-br from-accent to-[#e09340]"
        style="padding: 1vh 2.5vw; font-size: clamp(14px, 1.4vw, 16px); font-weight: 700;"
      >
        Hi, {{ authStore.user?.username }}
      </button>
      <button
        v-if="showMyClips"
        @click="$router.push('/my-clips')"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-to-br from-[#aaaaaa] to-[#999999]"
        style="padding: 1vh 2.5vw; font-size: clamp(14px, 1.4vw, 16px); font-weight: 700;"
      >
        My Clips
      </button>
      <button
        @click="handleLogout"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-to-br from-[#aaaaaa] to-[#999999]"
        style="padding: 1vh 2.5vw; font-size: clamp(14px, 1.4vw, 16px); font-weight: 700;"
      >
        Logout
      </button>
    </template>
    <template v-else>
      <button
        @click="$router.push('/login')"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-to-br from-[#aaaaaa] to-[#999999]"
        style="padding: 1vh 2.5vw; font-size: clamp(14px, 1.4vw, 16px); font-weight: 700;"
      >
        Login
      </button>
      <button
        @click="$router.push('/register')"
        class="text-white border-none rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-strong hover:shadow-hover active:shadow-active bg-gradient-to-br from-[#aaaaaa] to-[#999999]"
        style="padding: 1vh 2.5vw; font-size: clamp(14px, 1.4vw, 16px); font-weight: 700;"
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


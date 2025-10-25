<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const login = ref('')
const password = ref('')
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''

  const success = await authStore.login({
    login: login.value,
    password: password.value,
  })

  if (success) {
    router.push('/search')
  } else {
    errorMessage.value = authStore.error || 'Login failed'
  }
}
</script>

<template>
  <main class="flex flex-row justify-center items-center w-full min-h-screen box-border p-10 gap-[100px] max-[850px]:flex-col max-[850px]:mt-0 max-[850px]:text-center max-[850px]:min-h-screen max-[850px]:p-[20px_15px] max-[850px]:gap-[15px] max-[850px]:justify-center max-[850px]:overflow-y-auto max-[480px]:!p-[10px_8px] max-[480px]:!gap-[8px]">
    <section class="flex flex-col items-center text-center transition-all duration-400">
      <router-link to="/" class="inline-block">
        <img src="/images/branding/logo.svg" class="block mx-auto scale-[1.9] -mt-10 mb-[90px] min-[850px]:max-[1899px]:!scale-[1.5] min-[850px]:max-[1899px]:!-mt-5 min-[850px]:max-[1899px]:!mb-15 min-[601px]:max-[1024px]:!scale-100 min-[601px]:max-[1024px]:!mt-[15px] min-[601px]:max-[1024px]:!mb-[15px] max-[600px]:!scale-[1.4] max-[600px]:!mt-2.5 max-[600px]:!mb-5 max-[480px]:!scale-90 max-[480px]:!mt-2.5 max-[480px]:!mb-2.5" alt="RanchBot Logo" />
      </router-link>
      <h1 class="text-center mt-15 scale-[1.9] transition-all duration-400 min-[850px]:max-[1899px]:!scale-[1.5] min-[850px]:max-[1899px]:!mt-10 min-[601px]:max-[1024px]:!scale-100 min-[601px]:max-[1024px]:!mt-3 max-[600px]:!scale-[1.4] max-[600px]:!mt-3 max-[480px]:!scale-90 max-[480px]:!mt-2">RanchBot</h1>
    </section>

    <section class="flex flex-col items-center transition-all duration-400">
      <div class="bench-container relative">
        <img src="/images/others/bench.svg" alt="Bench Graphic" class="bench-image w-full h-auto block" />
        <form class="form-overlay absolute top-0 left-0 w-full h-full" @submit.prevent="handleSubmit">
          <div v-if="errorMessage" class="absolute top-[15.5%] left-1/2 -translate-x-1/2 w-[70%] p-2.5 bg-[rgba(255,0,0,0.1)] border border-[#ff6b6b] rounded-s text-[#d63031] text-center font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.2)] text-[clamp(12px,1vw,14px)] max-[480px]:!top-[13%] max-[480px]:!w-[75%] max-[480px]:!text-[11px] max-[480px]:!p-2">{{ errorMessage }}</div>
          <input
            v-model="login"
            type="text"
            name="login"
            placeholder="username"
            required
            autofocus
            class="absolute left-[15%] top-[23.5%] w-[70%] h-[8%] border-none rounded-s text-center shadow-input-inset bg-form-input text-form-text placeholder-form-placeholder placeholder-opacity-80 focus:outline-[2px_solid_#c58b4f] focus:bg-form-focus text-[clamp(14px,1.2vw,18px)] max-[480px]:!text-base max-[480px]:!h-[9%] max-[480px]:!left-[15.5%] max-[480px]:!w-[69%] min-[850px]:max-[1899px]:text-[clamp(14px,1vw,16px)]"
          />
          <input
            v-model="password"
            type="password"
            name="password"
            placeholder="password"
            required
            class="absolute left-[15%] top-[37.6%] w-[70%] h-[8%] border-none rounded-s text-center shadow-input-inset bg-form-input text-form-text placeholder-form-placeholder placeholder-opacity-80 focus:outline-[2px_solid_#c58b4f] focus:bg-form-focus text-[clamp(14px,1.2vw,18px)] max-[480px]:!text-base max-[480px]:!h-[9%] max-[480px]:!left-[15.5%] max-[480px]:!w-[69%] min-[850px]:max-[1899px]:text-[clamp(14px,1vw,16px)]"
          />
          <button
            type="submit"
            :disabled="authStore.loading"
            class="absolute top-[53%] left-0 w-full h-[5.5%] font-bold bg-gradient-form-btn border-2 border-[#aa9169] rounded-m cursor-pointer text-form-text transition-all duration-200 hover:scale-[1.04] hover:bg-gradient-form-btn-hover hover:shadow-hover active:scale-[0.96] active:shadow-active disabled:opacity-60 disabled:cursor-not-allowed shadow-strong text-[clamp(14px,1.2vw,18px)] max-[480px]:!h-[5.5%] max-[480px]:!transform-none min-[850px]:max-[1899px]:text-[clamp(12px,1vw,16px)]"
          >
            {{ authStore.loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>

      <div class="mt-2.5 flex gap-5 w-full justify-center">
        <button @click="$router.push('/register')" class="bg-gradient-primary text-white p-[24px_60px] border-none rounded-m cursor-pointer font-semibold whitespace-nowrap transition-all duration-200 hover:scale-105 hover:bg-gradient-primary-hover active:scale-[0.97] active:shadow-active shadow-standard text-[clamp(28px,2.2vw,38px)] min-[850px]:max-[1899px]:!text-[clamp(32px,1.3vw,36px)] min-[850px]:max-[1899px]:!p-[8px_20px] min-[850px]:max-[1899px]:!max-w-[350px]">Create account</button>
        <button @click="$router.push('/forgot-password')" class="bg-gradient-primary text-white p-[24px_60px] border-none rounded-m cursor-pointer font-semibold whitespace-nowrap transition-all duration-200 hover:scale-105 hover:bg-gradient-primary-hover active:scale-[0.97] active:shadow-active shadow-standard text-[clamp(28px,2.2vw,38px)] min-[850px]:max-[1899px]:!text-[clamp(32px,1.3vw,36px)] min-[850px]:max-[1899px]:!p-[8px_20px] min-[850px]:max-[1899px]:!max-w-[350px]">Forgot password?</button>
      </div>
    </section>
  </main>
</template>

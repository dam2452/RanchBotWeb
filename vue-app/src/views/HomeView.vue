<script setup lang="ts">
import { useRouter } from 'vue-router'
import UserButtons from '@/components/UserButtons.vue'

const router = useRouter()

const goToSearch = () => {
  router.push('/search')
}
</script>

<template>
  <UserButtons fixed />
  <main class="flex items-center justify-between w-full min-h-screen p-10 box-border relative max-w-1600px mx-auto max-[1199px]:flex-col max-[1199px]:justify-center max-[850px]:mt-0 max-[850px]:text-center max-[850px]:p-[20px_15px] max-[850px]:gap-[15px] max-[480px]:!p-[10px_8px] max-[480px]:!gap-[8px] min-[1200px]:flex-row min-[1200px]:gap-[60px]">
    <div class="flex-1 flex flex-col items-center transition-all duration-400 max-[1199px]:flex-[0_0_auto] max-[1199px]:w-full max-[1199px]:max-w-[600px] max-[1199px]:order-1 max-[480px]:!p-[0_15px]">
      <router-link to="/" class="inline-block">
        <img src="/images/branding/logo.svg" class="mt-7.5 transition-transform duration-400 min-w-[160px] w-[clamp(200px,20vw,300px)] max-[1199px]:!w-[clamp(160px,40vw,240px)] min-[1800px]:!w-[clamp(250px,15vw,350px)]" alt="RanchBot Logo" />
      </router-link>
      <h1 class="text-center transition-all duration-400 m-[20px_0] text-[clamp(3.5rem,6vw,7rem)] max-[1199px]:!m-[20px_0_10px] max-[1199px]:!text-[clamp(2.2rem,8vw,5rem)] max-[480px]:!m-[0_15px_5px_15px] min-[1800px]:!text-[clamp(4rem,5vw,8rem)]">RanchBot</h1>
      <p class="tagline text-center max-[480px]:!m-[0_15px_10px_15px]">Find, cut, and share your favorite Ranczo scene — in seconds.</p>
      <button class="bg-btn-bg text-white p-[20px_40px] border-none rounded-xl cursor-pointer mb-7.5 transition-all duration-200 hover:scale-105 hover:shadow-hover active:scale-95 active:shadow-active shadow-strong text-[clamp(1.2rem,2vw,2rem)] max-[850px]:p-[16px_32px] max-[1199px]:!mb-[10px] max-[480px]:!mb-[5px] max-[480px]:!mx-[15px]" @click="goToSearch">enter a quote</button>
    </div>

    <div class="hidden min-[1200px]:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 z-10 transition-all duration-400 max-[1199px]:!static max-[1199px]:!block max-[1199px]:!transform-none max-[1199px]:!m-[20px_auto] max-[1199px]:!w-[60px] max-[1199px]:order-2 max-[480px]:!m-[10px_auto]">
      <img src="/images/ui/icons/arrow.svg" class="w-20 transition-all duration-400 animate-bounce max-[1199px]:!w-[60px] max-[1199px]:!rotate-90 max-[1199px]:!animate-bounce-rotated" alt="Arrow" />
    </div>

    <div class="flex-1 flex items-center justify-center transition-all duration-400 min-[1200px]:min-w-0 max-[1199px]:flex-[0_0_auto] max-[1199px]:w-full max-[1199px]:max-w-800px max-[1199px]:order-3 max-[1199px]:mt-7.5 max-[500px]:!w-[90%] max-[500px]:!mx-auto max-[500px]:!mt-[-20px] max-[480px]:!mt-[15px]">
      <router-link to="/search" class="cursor-pointer block max-w-700px w-full transition-transform duration-300 hover:scale-102 active:scale-95 min-[1800px]:max-w-800px">
        <img src="/images/others/KusyDworek.png" class="block w-full h-auto object-cover rounded-[30px] transition-all duration-400 shadow-hover max-[1199px]:w-[90%] max-[1199px]:max-w-[720px] max-[1199px]:mx-auto max-[500px]:!mt-[-60px] max-[500px]:!w-full max-[500px]:!max-w-full max-[480px]:!mt-[-80px] max-[480px]:!w-[95vw] max-[480px]:!max-w-[95vw]" alt="Dworek Kusy" />
      </router-link>
    </div>
  </main>
</template>

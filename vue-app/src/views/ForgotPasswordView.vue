<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <AppFooter />

  <main class="flex items-center justify-center min-h-screen p-5">
    <div class="bg-[#dcae75] rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-12 pb-[60px] max-w-[700px] w-full text-center border-[3px] border-[#aa9169]">
      <h1 class="text-5xl font-bold mb-6 text-[#8B4513]">Password Recovery</h1>
      <div class="bg-[#fdda9f] border-2 border-[#c58b4f] p-5 mb-6 rounded-[24px]">
        <p class="text-xl font-bold text-[#8B4513] mb-2">The password recovery feature is currently disabled.</p>
      </div>
      <p class="mb-6 text-lg text-[#5a3417] font-medium">
        The application is in closed beta. To reset your password, please contact the
        administrator.
      </p>
      <p class="mb-8 text-lg text-[#5a3417] font-medium">Remember your password?</p>
      <router-link
        to="/login"
        class="inline-block bg-gradient-to-r from-[#fdd99d] to-[#dcae75] text-[#8B4513] px-32 py-10 rounded-[32px] no-underline font-bold text-6xl transition-all duration-200 shadow-[0_6px_14px_rgba(0,0,0,0.3)] hover:scale-105 hover:shadow-[0_8px_16px_rgba(0,0,0,0.3)] border-[4px] border-[#aa9169] min-w-[400px]"
      >
        Log in
      </router-link>
    </div>
  </main>
</template>

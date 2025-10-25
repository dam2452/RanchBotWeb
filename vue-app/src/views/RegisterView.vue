<script setup lang="ts">
</script>

<template>
  <main class="flex items-center justify-center min-h-screen p-5">
    <div class="bg-white rounded-xl shadow-strong p-10 max-w-[600px] w-full text-center">
      <h1 class="text-4xl font-bold mb-5 text-dark">Registration</h1>
      <p class="text-xl font-bold mb-5 text-warning">Registration of new users is currently disabled.</p>
      <p class="mb-5 text-lg">The application is in closed beta. To get access, please contact the administrator.</p>
      <p class="mb-5 text-lg">Already have an account?</p>
      <router-link to="/login" class="inline-block bg-gradient-action text-white p-[12px_30px] rounded-[25px] no-underline font-semibold transition-all duration-300 shadow-standard hover:-translate-y-[3px] hover:shadow-hover">Log in</router-link>
    </div>
  </main>
</template>

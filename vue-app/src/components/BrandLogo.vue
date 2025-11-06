<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})
</script>

<template>
  <router-link to="/" class="logo-link">
    <img
      src="/images/branding/logo.svg"
      :class="['logo', `logo-${size}`]"
      alt="RanchBot Logo"
    />
  </router-link>
</template>

<style scoped>
.logo-link {
  display: inline-block;
}

.logo {
  transition: transform 0.4s;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-small {
  width: 80px;
}

.logo-medium {
  width: 110px;
}

.logo-large {
  width: clamp(160px, 40vw, 240px);
}

@media (min-width: 1200px) {
  .logo-large {
    min-width: 160px;
    width: clamp(200px, 20vw, 300px);
  }
}

@media (min-width: 1800px) {
  .logo-large {
    width: clamp(250px, 15vw, 350px);
  }
}
</style>

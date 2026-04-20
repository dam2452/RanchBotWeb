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
  width: 120px;
}

.logo-medium {
  width: 165px;
}

.logo-large {
  width: clamp(240px, 60vw, 360px);
}

@media (min-width: 1200px) {
  .logo-large {
    min-width: 240px;
    width: clamp(300px, 30vw, 450px);
  }
}

@media (min-width: 1800px) {
  .logo-large {
    width: clamp(375px, 22.5vw, 525px);
  }
}
</style>
